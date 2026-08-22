/**
 * Contact details are a protected class, structurally — not a masking trick.
 *
 * A CV splits into two kinds of data, and they carry completely different
 * risk:
 *
 *   - **Contact details** — name, email, phone, address. Directly identifying,
 *     the most regulated category, and of no coaching value whatsoever. Nobody
 *     needs to read someone's phone number to tell them their bullet points
 *     are vague.
 *   - **CV content** — summary, experience, education, skills. This is the
 *     thing the product exists to work on. It has to be visible to the coach,
 *     to the user, and (with consent) in a session recording.
 *
 * The rule: contact details never leave our database in readable form, and
 * never render outside a PrivateRegion. That holds for AI prompts, session
 * replay, admin views, exports and logs alike — so whether someone is watching
 * a recording of a CV edit, a cover letter, or anything we build next, the
 * same boundary applies without anyone having to remember it per feature.
 *
 * Two enforcement points, deliberately mirrored:
 *   - Server: `redactContact()` before anything is sent to a third party.
 *   - Client: `<PrivateRegion>` around any render of these fields.
 */

/** The fields that count as contact details, wherever they appear. */
export const CONTACT_FIELDS = ['name', 'email', 'phone', 'location', 'address'] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

/**
 * The attribute every private region carries.
 *
 * One string rather than a remembered class name, so masking selectors,
 * admin views and any future export all key off the same thing. Session
 * replay tools take a CSS selector; this is it.
 */
export const PRIVATE_ATTR = 'data-private';
export const PRIVATE_SELECTOR = '[data-private]';

/**
 * Replaces contact values with presence flags, for anything crossing a
 * network boundary we don't own.
 *
 * Presence rather than removal because the coach genuinely needs to know
 * whether a CV is missing an email — that's a real piece of feedback — but
 * never needs to read it. `{ email: "sam@example.com" }` becomes
 * `{ hasEmail: true }`, which answers the coaching question and carries no
 * personal data.
 */
export function redactContact<T extends Record<string, any>>(
  cv: T
): Omit<T, 'contact' | 'personalInfo' | 'personal_info'> & { contactPresence: Record<string, boolean> } {
  const { contact, personalInfo, personal_info, ...rest } = cv as any;
  const source = contact || personalInfo || personal_info || {};

  const contactPresence: Record<string, boolean> = {};
  for (const field of CONTACT_FIELDS) {
    const value = source[field];
    contactPresence[`has${field.charAt(0).toUpperCase()}${field.slice(1)}`] =
      typeof value === 'string' ? value.trim().length > 0 : !!value;
  }

  return { ...rest, contactPresence };
}
