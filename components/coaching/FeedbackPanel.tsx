/**
 * The shared shape of coaching feedback: what's working, and what's worth
 * thinking about.
 *
 * The same idea previously had three different visual treatments - CV
 * analysis, cover letter review, and interview feedback each rolled their
 * own - which was the clearest signal that these were separate tools sharing
 * a login rather than one product. One component means a student learns to
 * read feedback once.
 *
 * The asymmetry is deliberate and matches the coaching philosophy: strengths
 * are statements (here's what landed), while the other side is always
 * questions rather than instructions, so the work stays the user's own.
 */

export function FeedbackStrengths({
  items,
  title = "What's working"
}: {
  items: string[];
  title?: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-display font-bold text-text-primary mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="font-body text-sm text-text-secondary flex items-start gap-2">
            <span className="text-success shrink-0" aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackQuestions({
  items,
  title = 'Worth thinking about'
}: {
  items: string[];
  title?: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-display font-bold text-text-primary mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="font-body text-sm text-text-secondary flex items-start gap-2">
            <span className="text-accent-tertiary shrink-0" aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface StarPart {
  present: boolean;
  note?: string;
}

export interface StarBreakdown {
  situation: StarPart;
  task: StarPart;
  action: StarPart;
  result: StarPart;
}

/**
 * STAR as four independent pass/fail cards.
 *
 * `compact` drops the notes for tight spaces (the in-call panel), keeping
 * only the four verdicts.
 */
export function StarPanel({
  star,
  compact = false
}: {
  star: StarBreakdown;
  compact?: boolean;
}) {
  const parts = ['situation', 'task', 'action', 'result'] as const;
  return (
    <div>
      <h3 className="font-display font-bold text-text-primary mb-1">Structure</h3>
      {!compact && (
        <p className="font-body text-xs text-text-secondary mb-3">
          Behavioural answers land best as Situation, Task, Action, Result.
        </p>
      )}
      <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
        {parts.map(key => {
          const part = star[key];
          if (!part) return null;
          return (
            <div
              key={key}
              className={`rounded-lg border p-3 ${
                part.present
                  ? 'border-success/40 bg-success/10'
                  : 'border-cta-primary/40 bg-cta-primary/10'
              }`}
            >
              <p className="font-body text-sm font-bold text-text-primary capitalize flex items-center gap-1.5">
                <span className={part.present ? 'text-success' : 'text-text-cta'} aria-hidden="true">
                  {part.present ? '✓' : '✕'}
                </span>
                {key}
                <span className="sr-only">{part.present ? ' — present' : ' — missing'}</span>
              </p>
              {!compact && part.note && (
                <p className="font-body text-xs text-text-secondary mt-1">{part.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
