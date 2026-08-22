import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { isOwner } from '@/lib/flags';

/**
 * Owner-only rollup for the admin metrics page.
 *
 * Reads Postgres, not Mixpanel, on purpose: applications, outcomes and spend
 * are facts the database owns, and Mixpanel drops events to ad blockers.
 * Mixpanel stays the behavioural layer - where people click and how long they
 * linger. This is the ledger.
 *
 * Costs are read from ai_usage, which only starts at migration 016. Anything
 * before that is genuinely unrecoverable, so the page reports when the meter
 * started rather than implying the number is lifetime.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isOwner(session?.user?.email)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [spend, bySurface, byTier, perUser, funnel, outcomes, effort] = await Promise.all([
      db.query(
        `SELECT
           COALESCE(SUM(cost_usd), 0)::float AS total,
           COALESCE(SUM(cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::float AS last_30d,
           COALESCE(SUM(cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0)::float AS last_7d,
           -- Calls that errored or hit max_tokens. Still billed, easy to miss.
           COALESCE(SUM(cost_usd) FILTER (WHERE NOT succeeded), 0)::float AS wasted,
           COUNT(*)::int AS calls,
           MIN(created_at) AS since
         FROM ai_usage`
      ),
      db.query(
        `SELECT surface,
                COUNT(*)::int AS calls,
                COALESCE(SUM(cost_usd), 0)::float AS cost,
                COALESCE(AVG(cost_usd), 0)::float AS avg_cost
         FROM ai_usage GROUP BY surface ORDER BY cost DESC`
      ),
      db.query(
        `SELECT COALESCE(tier, 'unknown') AS tier,
                COUNT(*)::int AS calls,
                COALESCE(SUM(cost_usd), 0)::float AS cost,
                COALESCE(AVG(cost_usd), 0)::float AS avg_cost
         FROM ai_usage GROUP BY tier ORDER BY cost DESC`
      ),
      // The mean hides the user re-analysing forty times on Sonnet, which is
      // the actual risk. P90 is the number that should set tier limits.
      db.query(
        `WITH per_user AS (
           SELECT user_id, SUM(cost_usd)::float AS cost FROM ai_usage GROUP BY user_id
         )
         SELECT
           COUNT(*)::int AS users,
           COALESCE(AVG(cost), 0)::float AS mean,
           COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cost), 0)::float AS p50,
           COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY cost), 0)::float AS p90,
           COALESCE(MAX(cost), 0)::float AS max
         FROM per_user`
      ),
      db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM users) AS signed_up,
           (SELECT COUNT(DISTINCT user_id)::int FROM cv_data) AS uploaded_cv,
           (SELECT COUNT(DISTINCT user_id)::int FROM coaching_recommendations
             WHERE type = 'cv_analysis') AS analysed_cv,
           (SELECT COUNT(DISTINCT user_id)::int FROM cover_letters) AS wrote_letter,
           (SELECT COUNT(DISTINCT user_id)::int FROM applications
             WHERE status <> 'draft') AS applied,
           (SELECT COUNT(DISTINCT user_id)::int FROM interview_practice_sessions) AS practised`
      ),
      db.query(
        `SELECT
           COUNT(*)::int AS applications,
           COUNT(*) FILTER (WHERE status IN ('interviewing', 'offer'))::int AS reached_interview,
           COUNT(*) FILTER (WHERE status = 'offer')::int AS offers,
           COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
           COUNT(*) FILTER (WHERE status = 'no_response')::int AS no_response,
           COUNT(*) FILTER (WHERE status = 'applied')::int AS awaiting
         FROM applications WHERE status <> 'draft'`
      ),
      // Effort in, against outcomes out - the ratio the whole product rests on.
      db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM cv_data) AS cvs,
           (SELECT COUNT(*)::int FROM coaching_recommendations WHERE type = 'cv_analysis') AS analyses,
           (SELECT COUNT(*)::int FROM cover_letters) AS letters,
           (SELECT COUNT(*)::int FROM cover_letters WHERE application_id IS NULL) AS letters_never_sent`
      )
    ]);

    const s = spend.rows[0];
    const f = funnel.rows[0];
    const o = outcomes.rows[0];
    const e = effort.rows[0];

    const rate = (num: number, denom: number) => (denom > 0 ? num / denom : null);

    return NextResponse.json({
      spend: {
        total: s.total,
        last30d: s.last_30d,
        last7d: s.last_7d,
        wasted: s.wasted,
        calls: s.calls,
        since: s.since,
        bySurface: bySurface.rows,
        byTier: byTier.rows,
        perUser: perUser.rows[0],
        // The number that decides whether a subscription can cover the
        // product: everything spent, over everyone it actually got applying.
        costPerActivatedUser: rate(s.total, f.applied)
      },
      funnel: {
        signedUp: f.signed_up,
        uploadedCv: f.uploaded_cv,
        analysedCv: f.analysed_cv,
        wroteLetter: f.wrote_letter,
        applied: f.applied,
        practised: f.practised,
        // Does the product do its job at all?
        uploadToApplied: rate(f.applied, f.uploaded_cv)
      },
      outcomes: {
        ...o,
        // The only metric that shows the coaching works rather than just gets
        // used. Needs real volume before it means anything.
        interviewRate: rate(o.reached_interview, o.applications),
        offerRate: rate(o.offers, o.applications),
        noResponseRate: rate(o.no_response, o.applications),
        // Below ~1.5 this is a one-off tool, not a habit.
        applicationsPerApplicant: rate(o.applications, f.applied)
      },
      effort: {
        ...e,
        // Re-analysis is uncapped on paid tiers; this is where cost runs away.
        analysesPerCv: rate(e.analyses, e.cvs)
      }
    });
  } catch (error: any) {
    console.error('Admin metrics error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to load metrics', details: error.message },
      { status: 500 }
    );
  }
}
