import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

// Lightweight rollup of what the user has already done, used to drive
// dashboard card state (e.g. "Continue" vs "Get Started") and whether the
// onboarding checklist still needs to be shown.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [cvResult, sessionsResult, skillsResult, userResult, coverLettersResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*)::int AS count, MAX(updated_at) AS latest FROM cv_data WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS count, MAX(started_at) AS latest
         FROM interview_practice_sessions WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM skills_assessments WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT getting_started_dismissed_at FROM users WHERE id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM cover_letters WHERE user_id = $1`,
        [userId]
      )
    ]);

    return NextResponse.json({
      cvCount: cvResult.rows[0]?.count || 0,
      cvUpdatedAt: cvResult.rows[0]?.latest || null,
      interviewSessionCount: sessionsResult.rows[0]?.count || 0,
      latestInterviewAt: sessionsResult.rows[0]?.latest || null,
      skillsAssessedCount: skillsResult.rows[0]?.count || 0,
      gettingStartedDismissed: !!userResult.rows[0]?.getting_started_dismissed_at,
      coverLetterCount: coverLettersResult.rows[0]?.count || 0
    });
  } catch (error: any) {
    console.error('Dashboard status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard status', details: error.message },
      { status: 500 }
    );
  }
}
