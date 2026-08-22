import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applications';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ordered by most recent activity rather than creation: a job search is
    // worked on out of order, and the thing you touched last is usually the
    // thing you're thinking about.
    const result = await db.query(
      `SELECT
         a.id, a.company_name, a.job_title, a.source, a.status,
         a.applied_at, a.notes, a.created_at, a.updated_at,
         a.cv_id, cd.name AS cv_name,
         (SELECT COUNT(*)::int FROM cover_letters cl WHERE cl.application_id = a.id) AS letter_count
       FROM applications a
       LEFT JOIN cv_data cd ON cd.id = a.cv_id
       WHERE a.user_id = $1
       ORDER BY a.updated_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      applications: result.rows.map((row: any) => ({
        id: row.id,
        companyName: row.company_name || '',
        jobTitle: row.job_title,
        source: row.source || '',
        status: row.status,
        appliedAt: row.applied_at,
        notes: row.notes || '',
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, jobTitle, jobDescription, source, status, cvId, notes, appliedAt } =
      await req.json();

    if (!jobTitle?.trim()) {
      return NextResponse.json({ error: 'A job title is required' }, { status: 400 });
    }
    if (status && !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // A CV is optional, but if one is named it has to be the user's own.
    if (cvId) {
      const owns = await db.query(`SELECT id FROM cv_data WHERE id = $1 AND user_id = $2`, [
        cvId,
        session.user.id
      ]);
      if (owns.rows.length === 0) {
        return NextResponse.json({ error: 'CV not found' }, { status: 404 });
      }
    }

    const finalStatus: ApplicationStatus = status || 'draft';

    // Logging something you already sent is the common case for applications
    // made outside Friday, so applied_at is stamped immediately rather than
    // waiting for a later status change it already passed.
    const stampApplied =
      appliedAt || (finalStatus !== 'draft' ? new Date().toISOString() : null);

    const result = await db.query(
      `INSERT INTO applications (
         user_id, cv_id, company_name, job_title, job_description,
         source, status, applied_at, notes, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id`,
      [
        session.user.id,
        cvId || null,
        companyName || null,
        jobTitle.trim(),
        jobDescription || null,
        source || null,
        finalStatus,
        stampApplied,
        notes || null
      ]
    );

    return NextResponse.json({ success: true, applicationId: result.rows[0].id });
  } catch (error: any) {
    console.error('Application create error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to create application', details: error.message },
      { status: 500 }
    );
  }
}
