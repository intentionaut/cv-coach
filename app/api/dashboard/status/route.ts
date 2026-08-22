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

    const [cvResult, sessionsResult, userResult, coverLettersResult] = await Promise.all([
      // analysed_count drives the CV card's "Draft" vs "Analysed" state -
      // counting distinct CVs that have at least one stored analysis, not
      // total analyses (re-analysing the same CV shouldn't inflate progress).
      db.query(
        `SELECT
           COUNT(*)::int AS count,
           MAX(cd.updated_at) AS latest,
           (
             SELECT COUNT(DISTINCT cr.cv_id)::int
             FROM coaching_recommendations cr
             WHERE cr.user_id = $1 AND cr.type = 'cv_analysis' AND cr.cv_id IS NOT NULL
           ) AS analysed_count
         FROM cv_data cd WHERE cd.user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*)::int AS count, MAX(started_at) AS latest
         FROM interview_practice_sessions WHERE user_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT getting_started_dismissed_at FROM users WHERE id = $1`,
        [userId]
      ),
      // applied_count = letters that have actually been sent somewhere, the
      // real end of the funnel, vs. drafts still being worked on.
      db.query(
        `SELECT
           COUNT(*)::int AS count,
           COUNT(*) FILTER (WHERE status <> 'draft')::int AS applied_count
         FROM cover_letters WHERE user_id = $1`,
        [userId]
      )
    ]);

    return NextResponse.json({
      cvCount: cvResult.rows[0]?.count || 0,
      cvAnalysedCount: cvResult.rows[0]?.analysed_count || 0,
      cvUpdatedAt: cvResult.rows[0]?.latest || null,
      interviewSessionCount: sessionsResult.rows[0]?.count || 0,
      latestInterviewAt: sessionsResult.rows[0]?.latest || null,
      gettingStartedDismissed: !!userResult.rows[0]?.getting_started_dismissed_at,
      coverLetterCount: coverLettersResult.rows[0]?.count || 0,
      appliedCount: coverLettersResult.rows[0]?.applied_count || 0
    });
  } catch (error: any) {
    console.error('Dashboard status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard status', details: error.message },
      { status: 500 }
    );
  }
}
