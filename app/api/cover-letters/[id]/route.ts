import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

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

    // Status and applied_at belong to the application this letter was sent
    // as part of. Null means it hasn't been sent.
    const result = await db.query(
      `SELECT cl.id, cl.cv_id, cl.application_id, cl.company_name, cl.job_title,
              cl.job_description, cl.content, cl.updated_at,
              a.status AS status,
              a.applied_at AS applied_at
       FROM cover_letters cl
       LEFT JOIN applications a ON a.id = cl.application_id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }
    const letter = result.rows[0];

    return NextResponse.json({
      id: letter.id,
      cvId: letter.cv_id,
      applicationId: letter.application_id,
      companyName: letter.company_name || '',
      jobTitle: letter.job_title,
      jobDescription: letter.job_description || '',
      content: letter.content || '',
      status: letter.status,
      appliedAt: letter.applied_at,
      updatedAt: letter.updated_at
    });
  } catch (error: any) {
    console.error('Cover letter fetch error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch cover letter', details: error.message },
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
    // Status is deliberately not accepted here - it belongs to the
    // application, and PATCH /api/applications/[id] is where it's set. Two
    // writable copies of the same fact is how they drift.
    const { companyName, jobTitle, jobDescription, content } = await req.json();

    if (
      companyName === undefined &&
      jobTitle === undefined &&
      jobDescription === undefined &&
      content === undefined
    ) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const sets: string[] = [];
    const values: any[] = [];
    if (companyName !== undefined) {
      sets.push(`company_name = $${sets.length + 1}`);
      values.push(companyName);
    }
    if (jobTitle !== undefined) {
      sets.push(`job_title = $${sets.length + 1}`);
      values.push(jobTitle);
    }
    if (jobDescription !== undefined) {
      sets.push(`job_description = $${sets.length + 1}`);
      values.push(jobDescription);
    }
    if (content !== undefined) {
      sets.push(`content = $${sets.length + 1}`);
      values.push(content);
    }
    sets.push('updated_at = NOW()');

    const result = await db.query(
      `UPDATE cover_letters SET ${sets.join(', ')} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING id, application_id`,
      [...values, id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    // Correcting the company or role on the letter is correcting it on the
    // job you're going for, so the application follows.
    const applicationId = result.rows[0].application_id;
    if (applicationId && (companyName !== undefined || jobTitle !== undefined || jobDescription !== undefined)) {
      const appSets: string[] = [];
      const appValues: any[] = [];
      if (companyName !== undefined) {
        appSets.push(`company_name = $${appSets.length + 1}`);
        appValues.push(companyName || null);
      }
      if (jobTitle !== undefined && jobTitle.trim()) {
        appSets.push(`job_title = $${appSets.length + 1}`);
        appValues.push(jobTitle.trim());
      }
      if (jobDescription !== undefined) {
        appSets.push(`job_description = $${appSets.length + 1}`);
        appValues.push(jobDescription || null);
      }
      if (appSets.length > 0) {
        appSets.push('updated_at = NOW()');
        await db.query(
          `UPDATE applications SET ${appSets.join(', ')} WHERE id = $${appValues.length + 1} AND user_id = $${appValues.length + 2}`,
          [...appValues, applicationId, session.user.id]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cover letter update error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to update cover letter', details: error.message },
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

    const result = await db.query(
      `DELETE FROM cover_letters WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cover letter delete error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to delete cover letter', details: error.message },
      { status: 500 }
    );
  }
}
