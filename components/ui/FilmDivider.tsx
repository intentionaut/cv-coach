/**
 * Sprocket-hole strip for separating marketing sections.
 *
 * Decoration only — always hidden from assistive tech. See the
 * `.film-perforation` rules in globals.css for why this exists in place of
 * photography, and use `tone="dark"` when it sits on the navy hero.
 */
export default function FilmDivider({
  tone = 'light',
  className = ''
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`${tone === 'dark' ? 'film-perforation-invert' : 'film-perforation'} ${className}`}
    />
  );
}
