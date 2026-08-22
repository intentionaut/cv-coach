import mixpanel from 'mixpanel-browser';

/**
 * Friday's analytics event taxonomy.
 *
 * Autocapture already records clicks and pageviews, which is enough for
 * heatmaps and nothing else. These are the semantic events - the ones that
 * answer the questions actually worth asking, like "what share of people who
 * upload a CV ever mark an application as sent?".
 *
 * Three rules, and they matter:
 *
 * 1. **The taxonomy mirrors the user journey**, not the codebase. Events are
 *    named for what the person did (Application Sent), not what the system
 *    did (POST /api/cover-letters/:id PATCH status). Analytics that describes
 *    your implementation stops being readable the moment you refactor.
 *
 * 2. **No PII, ever.** No CV text, no answers, no company names, no job
 *    titles, no email addresses. Properties are counts, categories, scores and
 *    booleans - enough to segment, never enough to identify a person or
 *    reconstruct what they wrote. Mixpanel is a third party and the product
 *    promises users their CV isn't shared.
 *
 * 3. **Outcomes over activity.** The Friday brief settled on applications and
 *    offers as the honest North Star, precisely because engagement metrics
 *    reward the user *not* getting hired. Session counts are here for
 *    diagnostics; the funnel is what matters.
 */

/** Past-tense, title-case, user-perspective. Never rename one in place - a
 *  renamed event silently splits its own history in two. */
export const EVENTS = {
  // --- Stage 1: the CV ---
  CV_UPLOADED: 'CV Uploaded',
  CV_ANALYSED: 'CV Analysed',
  ATS_CHECKS_VIEWED: 'ATS Checks Viewed',

  // --- Stage 2: the cover letter ---
  COVER_LETTER_GENERATED: 'Cover Letter Generated',
  COVER_LETTER_REVIEWED: 'Cover Letter Reviewed',

  // --- Stage 3: applying, and what came back. The point of the product. ---
  APPLICATION_SENT: 'Application Sent',
  APPLICATION_OUTCOME_UPDATED: 'Application Outcome Updated',

  // --- Practice ---
  PRACTICE_STARTED: 'Practice Session Started',
  PRACTICE_ANSWER_SUBMITTED: 'Practice Answer Submitted',
  PRACTICE_COMPLETED: 'Practice Session Completed'
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Only primitives - nested objects are painful to query in Mixpanel. */
type Props = Record<string, string | number | boolean | null | undefined>;

/**
 * Fire an event. Safe to call anywhere: no-ops on the server and when the SDK
 * hasn't initialised (no token configured), so callers never need to guard.
 */
export function track(event: EventName, props: Props = {}) {
  if (typeof window === 'undefined') return;
  try {
    mixpanel.track(event, props);
  } catch {
    // Analytics must never break a user action. If Mixpanel is blocked by an
    // ad blocker or failed to init, that's not the user's problem.
  }
}

/**
 * Buckets a score rather than sending the raw number.
 *
 * Raw scores are high-cardinality and mostly useless for segmentation - you
 * want "how do people scoring poorly behave differently", not a 101-way split.
 */
export function scoreBand(score: number): string {
  if (score >= 80) return '80-100';
  if (score >= 60) return '60-79';
  if (score >= 40) return '40-59';
  return '0-39';
}
