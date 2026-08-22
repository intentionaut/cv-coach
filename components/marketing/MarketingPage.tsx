import Link from 'next/link';

/**
 * Shared furniture for the /product pages so all four read as one site.
 */

export function MarketingHero({
  eyebrow,
  title,
  standfirst
}: {
  eyebrow: string;
  title: string;
  standfirst: string;
}) {
  return (
    <div className="bg-accent-tertiary text-text-on-tertiary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-secondary mb-4">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-5 text-balance">
          {title}
        </h1>
        <p className="font-body text-lg text-text-inverse/85 max-w-2xl leading-relaxed">
          {standfirst}
        </p>
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  tint = false
}: {
  title?: string;
  children: React.ReactNode;
  tint?: boolean;
}) {
  return (
    <section className={tint ? 'bg-bg-surface border-y border-border-hairline' : ''}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {title && (
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6 text-balance">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="font-body text-text-secondary space-y-4 max-w-2xl leading-relaxed">{children}</div>;
}

/** A numbered step. Used where the order genuinely matters, not for decoration. */
export function Step({
  n,
  title,
  children
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span
        className="font-mono shrink-0 w-8 h-8 rounded-full bg-accent-secondary/40 text-text-primary flex items-center justify-center text-sm font-bold"
        aria-hidden="true"
      >
        {n}
      </span>
      <div>
        <h3 className="font-display font-bold text-text-primary mb-1">{title}</h3>
        <p className="font-body text-sm text-text-secondary leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

/** Pulled-out quote or principle. Sparingly - one per page at most. */
export function Pullquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-cta-primary pl-5 py-1 my-8 max-w-2xl">
      <p className="font-display text-xl text-text-primary leading-snug text-balance">{children}</p>
    </blockquote>
  );
}

export function ForTeachers({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border-hairline rounded-lg p-6 max-w-2xl">
      <h3 className="font-display font-bold text-text-primary mb-2">
        If you teach or advise students
      </h3>
      <div className="font-body text-sm text-text-secondary space-y-3 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function MarketingCta({
  heading,
  body,
  signedIn
}: {
  heading: string;
  body: string;
  signedIn: boolean;
}) {
  return (
    <div className="bg-accent-secondary/25 border-y border-border-hairline">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-3 text-balance">
          {heading}
        </h2>
        <p className="font-body text-text-secondary mb-6 max-w-xl mx-auto leading-relaxed">{body}</p>
        <Link
          href={signedIn ? '/cv' : '/login'}
          className="font-body inline-block px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition"
        >
          {signedIn ? 'Open Friday' : 'Get started'}
        </Link>
      </div>
    </div>
  );
}
