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

    const { id: sessionId } = await params;

    // Fetch practice session details, including the role context from the
    // linked CV - this is what lets practice questions and feedback be
    // specific to the job being prepared for rather than generic.
    const sessionResult = await db.query(
      `SELECT
        ips.*,
        jr.title as role_title,
        cd.name as cv_name,
        cd.job_title as cv_job_title,
        cd.job_description as cv_job_description,
        cd.summary as cv_summary
       FROM interview_practice_sessions ips
       LEFT JOIN job_roles jr ON ips.role_id = jr.id
       LEFT JOIN cv_data cd ON ips.cv_id = cd.id
       WHERE ips.id = $1 AND ips.user_id = $2`,
      [sessionId, session.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch all question responses for this session
    const responsesResult = await db.query(
      `SELECT
        id,
        question,
        question_category,
        question_difficulty,
        written_answer,
        confidence_score,
        clarity_score,
        ai_feedback,
        completed_at
       FROM interview_sessions
       WHERE practice_session_id = $1
       ORDER BY completed_at ASC`,
      [sessionId]
    );

    return NextResponse.json({
      session: sessionResult.rows[0],
      responses: responsesResult.rows
    });
  } catch (error: any) {
    console.error('Fetch session error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: error.message },
      { status: 500 }
    );
  }
}
