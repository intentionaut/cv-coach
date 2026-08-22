import Link from 'next/link';
import BetaSignup from '@/components/marketing/BetaSignup';
import FilmDivider from '@/components/ui/FilmDivider';

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

/**
 * The closing block on every product page.
 *
 * Friday is invite-only, so the page can't end on "sign up" - it ends on
 * "ask to be let in", and the difference is worth being honest about. The
 * production-slate strip and the note about how early this is both come from
 * that: an unknown product asking for your email has to say what it actually
 * is, and "one very patient beta tester" earns more trust than a confident
 * claim would.
 *
 * Signed-in visitors skip all of it and get a link into the app.
 */
export function MarketingCta({
  heading,
  body,
  signedIn,
  source
}: {
  heading: string;
  body: string;
  signedIn: boolean;
  /** Which page this is, so we learn which story converts. */
  source: string;
}) {
  if (signedIn) {
    return (
      <div className="bg-accent-secondary/25 border-y border-border-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-3 text-balance">
            {heading}
          </h2>
          <p className="font-body text-text-secondary mb-6 max-w-xl mx-auto leading-relaxed">
            {body}
          </p>
          <Link
            href="/cv"
            className="font-body inline-block px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition"
          >
            Open Friday
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-accent-tertiary text-text-on-tertiary">
      <FilmDivider tone="dark" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Production slate. A film-industry device rather than decoration:
            it says "this is early and we know it" before the copy does. */}
        <div className="flex flex-wrap gap-x-10 gap-y-3 pb-8 mb-8 border-b border-text-inverse/20">
          <SlateField label="Status" value="Private beta" />
          <SlateField label="Crew call" value="Now" />
          <SlateField label="Places" value="A handful at a time" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-balance">
              {heading}
            </h2>
            <p className="font-body text-text-inverse/85 leading-relaxed mb-6">{body}</p>
            <p className="font-body text-sm text-text-inverse/75 leading-relaxed">
              Friday is genuinely early. We&apos;re letting people in a handful at a time,
              because at this size it&apos;s still possible to read everything you send back
              and act on it. If you&apos;re trying to get your first roles in film, TV,
              theatre or broadcast, you&apos;re exactly who we want shaping what gets built
              next.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent-secondary mb-3">
              Two questions. That&apos;s it.
            </p>
            <BetaSignup source={source} tone="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlateField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-inverse/60">
        {label}
      </p>
      <p className="font-display text-sm font-bold text-text-on-tertiary mt-0.5">{value}</p>
    </div>
  );
}
