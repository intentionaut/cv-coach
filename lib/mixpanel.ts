import mixpanel from 'mixpanel-browser';
import { PRIVATE_SELECTOR } from '@/lib/privacy';

let initialized = false;

// Guarded so this only ever runs client-side, once - called from
// app/providers.tsx on mount, not at module load time (Next.js renders this
// module on the server too, where mixpanel-browser has nothing to attach to).
export function initMixpanel() {
  if (initialized || typeof window === 'undefined') return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    console.warn('NEXT_PUBLIC_MIXPANEL_TOKEN not set - Mixpanel tracking disabled.');
    return;
  }
  mixpanel.init(token, {
    // The Mixpanel project is on EU data residency. Without this the SDK
    // defaults to the US ingestion cluster, which silently DISCARDS events
    // for an EU project - no console error, no failed request, track() just
    // returns and nothing ever arrives. That cost us a day of "the
    // instrumentation looks fine but the dashboard is empty".
    api_host: 'https://api-eu.mixpanel.com',
    autocapture: true,
    track_pageview: true,
    // Anything inside a PrivateRegion is blocked from capture. Declared here
    // even though session recording is currently off, so the boundary is
    // already in place the moment it's switched on rather than being
    // remembered afterwards. See lib/privacy.ts.
    record_block_selector: PRIVATE_SELECTOR,
    record_mask_text_selector: PRIVATE_SELECTOR,
    debug: process.env.NODE_ENV !== 'production'
  });
  initialized = true;
}

// Ties Mixpanel's per-user tracking to our actual user IDs, so usage and
// engagement can be broken down per real user rather than anonymous devices.
export function identifyMixpanelUser(userId: string, email?: string | null, name?: string | null) {
  if (typeof window === 'undefined' || !initialized) return;
  mixpanel.identify(userId);
  if (email || name) {
    mixpanel.people.set({
      ...(email ? { $email: email } : {}),
      ...(name ? { $name: name } : {})
    });
  }
}

/**
 * User-level properties, set from the dashboard status rollup.
 *
 * Events tell you what someone did; these tell you who they are *now* - which
 * is what lets you ask "how do people who've sent an application behave
 * differently from those who haven't" without reconstructing it from event
 * history every time.
 *
 * Counts and stage only. No CV content, job titles, or company names: those
 * are the user's, and the product tells them their CV isn't shared.
 */
export function setUserProgress(progress: {
  cvCount: number;
  cvAnalysedCount: number;
  coverLetterCount: number;
  appliedCount: number;
  interviewingCount: number;
  offerCount: number;
  noResponseCount: number;
  interviewSessionCount: number;
}) {
  if (typeof window === 'undefined' || !initialized) return;

  // Furthest point reached, so cohorts can be compared by stage rather than
  // by raw counts.
  const stage =
    progress.offerCount > 0
      ? 'offer'
      : progress.interviewingCount > 0
        ? 'interviewing'
        : progress.appliedCount > 0
          ? 'applied'
          : progress.coverLetterCount > 0
            ? 'cover_letter'
            : progress.cvAnalysedCount > 0
              ? 'cv_analysed'
              : progress.cvCount > 0
                ? 'cv_uploaded'
                : 'signed_up';

  try {
    mixpanel.people.set({
      'CV Count': progress.cvCount,
      'CVs Analysed': progress.cvAnalysedCount,
      'Cover Letters': progress.coverLetterCount,
      'Applications Sent': progress.appliedCount,
      'Interviews Reached': progress.interviewingCount,
      'Offers': progress.offerCount,
      // Sent minus every outcome, positive or negative. The ratio of this to
      // Applications Sent is the number that tells you whether the CV work is
      // landing at all.
      'No Response': progress.noResponseCount,
      'Practice Sessions': progress.interviewSessionCount,
      'Furthest Stage': stage
    });
  } catch {
    // Never let analytics break the dashboard.
  }
}

export default mixpanel;
