/**
 * "just now" / "5m ago" / "3h ago" / "12d ago".
 *
 * Used on the CV and cover-letter card lists. Deliberately stops at days -
 * beyond a couple of weeks the exact age stops mattering for a job search,
 * and "47d ago" reads worse than it informs.
 */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
