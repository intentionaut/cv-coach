'use client';

import Link from 'next/link';

/**
 * The "back to dashboard" affordance, repeated across six pages.
 *
 * Deliberately just the link, not a whole PageHeader: those six pages place
 * it differently (above the title, below the title, right-aligned in a header
 * bar) and forcing one layout component over all three shapes would be a
 * worse abstraction than the duplication it replaced. What's genuinely shared
 * is the destination, the label and the arrow convention - so that's what
 * this owns, with className left to the caller for placement and weight.
 *
 * Uses Link rather than router.push so it behaves like a real link:
 * middle-click, cmd-click and "open in new tab" all work, which they didn't
 * when this was a button everywhere.
 */
export default function BackToDashboard({
  className = 'font-body text-text-link hover:text-text-cta font-medium'
}: {
  className?: string;
}) {
  return (
    <Link href="/dashboard" className={className}>
      ← Back to Dashboard
    </Link>
  );
}
