/**
 * An application is the record that you actually went for something.
 *
 * It is deliberately not a job-search tracker - LinkedIn and Mandy already do
 * that, and doing it worse isn't worth anyone's time. It exists to close the
 * loop the rest of the product opens: you tailored a CV, maybe wrote a letter,
 * and then you sent it. Clicking "I applied" is the only way one comes into
 * being, which is why there's no draft state here - by the time it exists, it
 * has been sent.
 *
 * What it does capture is structured: the role, and where possible the company
 * receiving it, carried over from whatever the user already told us.
 */

export const APPLICATION_STATUSES = [
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'no_response'
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
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
