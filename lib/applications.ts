/**
 * The application is the object the rest of the product hangs off: a CV is
 * tailored for one, a cover letter is written for one, an interview is
 * practised for one. Shared here rather than in the route file so client
 * components can use the labels without dragging server code into the bundle.
 */

export const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'no_response'
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Not sent yet',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  // Distinct from rejected, and the most common outcome in this industry.
  // Naming it plainly matters: someone counting five rejections feels worse
  // than someone who can see four of them never answered at all.
  no_response: 'No response'
};

/** Outcomes you can move to once something has been sent. */
export const OUTCOME_STATUSES: ApplicationStatus[] = [
  'interviewing',
  'offer',
  'rejected',
  'no_response'
];

export function isOpen(status: ApplicationStatus): boolean {
  return status === 'draft' || status === 'applied' || status === 'interviewing';
}
