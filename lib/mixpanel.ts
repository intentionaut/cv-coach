import mixpanel from 'mixpanel-browser';

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
    autocapture: true,
    track_pageview: true,
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

export default mixpanel;
