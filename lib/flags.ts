/**
 * Feature flags and the owner allowlist.
 *
 * The owner email was hardcoded in four separate files. Centralised here so
 * changing it is one edit rather than a search, and so "is this person allowed
 * to see unreleased work" is a named question rather than an inline string
 * comparison scattered through the UI.
 */

/** Overridable so this doesn't stay a literal forever. */
export const OWNER_EMAIL =
  process.env.NEXT_PUBLIC_OWNER_EMAIL || 'dasilvasaielle@gmail.com';

export function isOwner(email?: string | null): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Marketing pages under /product.
 *
 * Three states rather than a boolean, because "off" and "preview" are
 * genuinely different: preview lets the owner review real pages in production
 * without exposing half-finished copy, which is the whole point of building
 * them behind a flag.
 *
 *   off     - nobody sees them (404)
 *   preview - owner only (default while the copy is being written)
 *   public  - everyone, including logged-out visitors
 *
 * Flip via NEXT_PUBLIC_MARKETING_PAGES in Vercel; no deploy needed to change
 * audience, only to change content.
 */
export type MarketingVisibility = 'off' | 'preview' | 'public';

export function marketingVisibility(): MarketingVisibility {
  const raw = (process.env.NEXT_PUBLIC_MARKETING_PAGES || 'preview').toLowerCase();
  if (raw === 'off' || raw === 'public') return raw;
  return 'preview';
}

export function canSeeMarketingPages(email?: string | null): boolean {
  const visibility = marketingVisibility();
  if (visibility === 'public') return true;
  if (visibility === 'off') return false;
  return isOwner(email);
}
