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
      `SELECT a.id, a.company_name, a.job_title, a.job_description, a.status,
              a.applied_at, a.created_at, a.updated_at, a.cv_id, cd.name AS cv_name
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
      `SELECT id, updated_at FROM cover_letters
       WHERE application_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json({
      id: app.id,
      companyName: app.company_name || '',
      jobTitle: app.job_title,
      jobDescription: app.job_description || '',
      status: app.status,
      appliedAt: app.applied_at,
      cvId: app.cv_id,
      cvName: app.cv_name,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      letters: letters.rows.map((row: any) => ({ id: row.id, updatedAt: row.updated_at }))
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

/**
 * Outcomes, plus corrections to the two fields worth holding as structured
 * data: who it was for and what the role was. Deliberately nothing else -
 * notes and channel-tracking belong to the platforms that already do them.
 */
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
    const { companyName, jobTitle, status } = await req.json();

    if (status !== undefined && !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (jobTitle !== undefined && !jobTitle?.trim()) {
      return NextResponse.json({ error: 'Job title cannot be empty' }, { status: 400 });
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (companyName !== undefined) {
      sets.push(`company_name = $${sets.length + 1}`);
      values.push(companyName?.trim() || null);
    }
    if (jobTitle !== undefined) {
      sets.push(`job_title = $${sets.length + 1}`);
      values.push(jobTitle.trim());
    }
    if (status !== undefined) {
      sets.push(`status = $${sets.length + 1}`);
      values.push(status);
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

    // Detach rather than cascade: the letter is the user's own work and
    // outlives the record of having sent it. 015 changes the foreign key to
    // match, but doing it explicitly here keeps behaviour right either way.
    await db.query(
      `UPDATE cover_letters SET application_id = NULL
       WHERE application_id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

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
