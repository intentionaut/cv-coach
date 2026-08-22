/**
 * A real coaching exchange, shown rather than described.
 *
 * This is the homepage's proof. Friday's differentiator is that it won't hand
 * over finished prose — it names what's missing and asks the question that
 * gets the answer out of you. Every competitor's pitch is "we write it for
 * you", so claiming the opposite in prose reads as marketing. Showing three
 * lines of the actual thing doesn't, and none of them can put the same block
 * on their homepage because none of them work this way.
 *
 * Rules for anything shown here, same as the live prompts: name the gap, ask
 * the question, never supply the sentence. A "Friday says" block that contains
 * a ready-made CV line would contradict the product on its own homepage.
 */
export default function CoachingExchange({
  line,
  question,
  className = ''
}: {
  /** The weak CV line, in the user's voice. */
  line: string;
  /** What Friday asks about it. A question, never a rewrite. */
  question: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-bg-surface rounded-lg border border-border-hairline shadow-lg overflow-hidden ${className}`}
    >
      <div className="p-5 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
          Your line
        </p>
        <p className="font-body text-text-primary italic">&ldquo;{line}&rdquo;</p>
      </div>
      <div className="border-t border-border-hairline bg-accent-secondary/15 p-5 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-cta mb-2">
          Friday asks
        </p>
        <p className="font-body text-text-primary">{question}</p>
      </div>
    </div>
  );
}
