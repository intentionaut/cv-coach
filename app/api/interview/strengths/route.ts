import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

/**
 * Where a user is consistently strong or consistently struggling, by question
 * category, across every session.
 *
 * This is what the unused `progress_metrics` table was gesturing at with its
 * strong_categories / needs_work_categories columns. Computed live from
 * interview_sessions rather than cached there: at this scale the query is
 * trivial, and a denormalised copy only introduces a way for the numbers to
 * drift out of sync - which would be a bad failure in a feature whose whole
 * job is telling someone the truth about their progress.
 *
 * Reads assessedClarity out of ai_feedback (present on answers given after
 * the structured critique shipped) and falls back to the user's own
 * clarity_score where it isn't, so early answers still count.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.query(
      `SELECT
         question_category AS category,
         COUNT(*)::int AS answered,
         AVG(
           COALESCE(
             NULLIF(ai_feedback->>'assessedClarity', '')::numeric,
             clarity_score::numeric
           )
         ) AS avg_clarity
       FROM interview_sessions
       WHERE user_id = $1
         AND question_category IS NOT NULL
         AND (
           NULLIF(ai_feedback->>'assessedClarity', '') IS NOT NULL
           OR clarity_score IS NOT NULL
         )
       GROUP BY question_category
       HAVING COUNT(*) >= 1
       ORDER BY avg_clarity DESC NULLS LAST`,
      [session.user.id]
    );

    const categories = result.rows
      .filter((row: any) => row.avg_clarity !== null)
      .map((row: any) => ({
        category: row.category,
        answered: row.answered,
        avgClarity: Math.round(Number(row.avg_clarity) * 10) / 10
      }));

    // One data point isn't a pattern. Only claim a strength or a weak spot
    // once there's enough to be worth saying out loud.
    const enough = categories.filter((c: { answered: number }) => c.answered >= 2);

    return NextResponse.json({
      categories,
      strongest: enough.length >= 2 ? enough[0] : null,
      weakest: enough.length >= 2 ? enough[enough.length - 1] : null,
      totalAnswered: categories.reduce((sum: number, c: { answered: number }) => sum + c.answered, 0)
    });
  } catch (error: any) {
    console.error('Interview strengths error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to load practice strengths', details: error.message },
      { status: 500 }
    );
  }
}
