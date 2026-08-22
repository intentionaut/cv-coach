import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `status <> 'draft'` covers rows left over from 014's backfill, where
    // every existing cover letter became an application whether or not it had
    // been sent. 015 deletes those; this keeps the list honest until it runs.
    const result = await db.query(
      `SELECT
         a.id, a.company_name, a.job_title, a.status,
         a.applied_at, a.created_at, a.updated_at,
         a.cv_id, cd.name AS cv_name,
         (SELECT COUNT(*)::int FROM cover_letters cl WHERE cl.application_id = a.id) AS letter_count
       FROM applications a
       LEFT JOIN cv_data cd ON cd.id = a.cv_id
       WHERE a.user_id = $1 AND a.status <> 'draft'
       ORDER BY a.applied_at DESC NULLS LAST, a.created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      applications: result.rows.map((row: any) => ({
        id: row.id,
        companyName: row.company_name || '',
        jobTitle: row.job_title,
        status: row.status,
        appliedAt: row.applied_at,
        cvId: row.cv_id,
        cvName: row.cv_name,
        letterCount: row.letter_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Applications list error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch applications', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * "I applied."
 *
 * The only way an application is created. It's always triggered from something
 * the user already has - a CV they tailored or a letter they wrote - and that
 * thing gets attached, which is what makes the record worth anything later.
 *
 * Role, company and job description are carried over from the source rather
 * than re-asked. The user has already typed them once.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cvId, coverLetterId, companyName, jobTitle } = await req.json();

    if (!cvId && !coverLetterId) {
      return NextResponse.json(
        { error: 'An application has to come from a CV or a cover letter' },
        { status: 400 }
      );
    }

    let sourceCvId: string | null = cvId || null;
    let derivedJobTitle: string | null = jobTitle?.trim() || null;
    let derivedCompany: string | null = companyName?.trim() || null;
    let derivedDescription: string | null = null;

    if (coverLetterId) {
      const letter = await db.query(
        `SELECT id, cv_id, company_name, job_title, job_description
         FROM cover_letters WHERE id = $1 AND user_id = $2`,
        [coverLetterId, session.user.id]
      );
      if (letter.rows.length === 0) {
        return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
      }
      const row = letter.rows[0];
      sourceCvId = sourceCvId || row.cv_id;
      derivedJobTitle = derivedJobTitle || row.job_title;
      derivedCompany = derivedCompany || row.company_name;
      derivedDescription = row.job_description;
    }

    if (sourceCvId) {
      const cv = await db.query(
        `SELECT id, job_title, job_description FROM cv_data WHERE id = $1 AND user_id = $2`,
        [sourceCvId, session.user.id]
      );
      if (cv.rows.length === 0) {
        return NextResponse.json({ error: 'CV not found' }, { status: 404 });
      }
      derivedJobTitle = derivedJobTitle || cv.rows[0].job_title;
      derivedDescription = derivedDescription || cv.rows[0].job_description;
    }

    if (!derivedJobTitle?.trim()) {
      return NextResponse.json(
        { error: 'We need to know what role this was for' },
        { status: 400 }
      );
    }

    const created = await db.query(
      `INSERT INTO applications (
         user_id, cv_id, company_name, job_title, job_description,
         status, applied_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, 'applied', NOW(), NOW())
       RETURNING id`,
      [
        session.user.id,
        sourceCvId,
        derivedCompany,
        derivedJobTitle.trim(),
        derivedDescription
      ]
    );
    const applicationId = created.rows[0].id;

    if (coverLetterId) {
      await db.query(
        `UPDATE cover_letters SET application_id = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [applicationId, coverLetterId, session.user.id]
      );
    }

    return NextResponse.json({ success: true, applicationId });
  } catch (error: any) {
    console.error('Application create error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to record your application', details: error.message },
      { status: 500 }
    );
  }
}
