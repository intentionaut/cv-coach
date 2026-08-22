import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applications';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.query(
      `SELECT a.*, cd.name AS cv_name
       FROM applications a
       LEFT JOIN cv_data cd ON cd.id = a.cv_id
       WHERE a.id = $1 AND a.user_id = $2`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    const app = result.rows[0];

    const letters = await db.query(
      `SELECT id, content IS NOT NULL AND content <> '' AS has_content, updated_at
       FROM cover_letters WHERE application_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json({
      id: app.id,
      companyName: app.company_name || '',
      jobTitle: app.job_title,
      jobDescription: app.job_description || '',
      source: app.source || '',
      status: app.status,
      appliedAt: app.applied_at,
      notes: app.notes || '',
      cvId: app.cv_id,
      cvName: app.cv_name,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      letters: letters.rows.map((row: any) => ({
        id: row.id,
        hasContent: row.has_content,
        updatedAt: row.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Application fetch error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch application', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { companyName, jobTitle, jobDescription, source, status, notes, cvId } = body;

    if (status !== undefined && !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (jobTitle !== undefined && !jobTitle?.trim()) {
      return NextResponse.json({ error: 'Job title cannot be empty' }, { status: 400 });
    }

    const sets: string[] = [];
    const values: any[] = [];
    const push = (col: string, val: any) => {
      sets.push(`${col} = $${sets.length + 1}`);
      values.push(val);
    };

    if (companyName !== undefined) push('company_name', companyName || null);
    if (jobTitle !== undefined) push('job_title', jobTitle.trim());
    if (jobDescription !== undefined) push('job_description', jobDescription || null);
    if (source !== undefined) push('source', source || null);
    if (notes !== undefined) push('notes', notes || null);
    if (cvId !== undefined) push('cv_id', cvId || null);

    if (status !== undefined) {
      push('status', status);
      // Stamped once, the first time it leaves draft, and preserved after -
      // moving on to interviewing or rejected shouldn't rewrite the date you
      // actually sent it.
      if (status !== 'draft') {
        sets.push('applied_at = COALESCE(applied_at, NOW())');
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    sets.push('updated_at = NOW()');

    const result = await db.query(
      `UPDATE applications SET ${sets.join(', ')}
       WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
       RETURNING id`,
      [...values, id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Application update error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to update application', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Cover letters cascade with the application, which is the intent: the
    // letter was written for this job and has no meaning without it.
    const result = await db.query(
      `DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Application delete error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to delete application', details: error.message },
      { status: 500 }
    );
  }
}
