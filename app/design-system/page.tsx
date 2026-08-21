import Link from 'next/link';
import Image from 'next/image';

// Every value below is read from the live tokens in app/globals.css - this
// page is meant to stay in sync with what's actually implemented, not a
// hand-copied snapshot of the design doc. If you change a token's hex in
// globals.css, update it here too (there's no automated sync).
const colorGroups: Array<{
  title: string;
  tokens: Array<{ token: string; className: string; hex: string; usage: string; flag?: string }>;
}> = [
  {
    title: 'Surfaces',
    tokens: [
      { token: 'bg-main', className: 'bg-bg-main', hex: '#F5EFE4', usage: 'Page background' },
      { token: 'bg-surface', className: 'bg-bg-surface', hex: '#FBF7EC', usage: 'Card/panel surface, sits above bg-main' }
    ]
  },
  {
    title: 'Text',
    tokens: [
      { token: 'text-primary', className: 'bg-text-primary', hex: '#3D405B', usage: 'Headings, body, labels - the default' },
      { token: 'text-secondary', className: 'bg-text-secondary', hex: '#616487', usage: 'Secondary body, captions, hints, visited links' },
      {
        token: 'text-muted',
        className: 'bg-text-muted',
        hex: '#7D809F',
        usage: 'Muted text',
        flag: 'Large text only (≥18.66px regular or ≥14px bold) - fails AA-normal at smaller sizes. Use text-secondary below that.'
      },
      {
        token: 'text-disabled',
        className: 'bg-text-disabled',
        hex: '#9FA2BB',
        usage: 'Disabled control text',
        flag: 'WCAG-exempt (disabled controls), not a contrast pass - pair with disabled state, never colour alone.'
      },
      { token: 'text-inverse', className: 'bg-text-inverse', hex: '#F7F1E3', usage: 'Text on dark/tertiary surfaces' },
      { token: 'text-link', className: 'bg-text-link', hex: '#0B3D5B', usage: 'Default link colour' },
      { token: 'text-cta', className: 'bg-text-cta', hex: '#B24022', usage: 'Link hover, error message text, destructive text' },
      {
        token: 'text-on-cta',
        className: 'bg-text-on-cta',
        hex: '#FFFFFF',
        usage: 'Primary CTA button label',
        flag: 'Deliberately not WCAG-audited (brand contrast overrode the audited text-primary recommendation) - always pair with font-bold.'
      },
      { token: 'text-on-success', className: 'bg-text-on-success', hex: '#1B3A2E', usage: 'Text on the success surface' },
      { token: 'text-on-alert', className: 'bg-text-on-alert', hex: '#4A3612', usage: 'Text on the alert surface' },
      {
        token: 'text-on-tertiary',
        className: 'bg-text-on-tertiary',
        hex: '#F0E5D0',
        usage: 'Heading text on accent-tertiary dark surfaces',
        flag: "Known discrepancy: this should equal the current bg-main (#F5EFE4) per the audit doc's changelog, but wasn't updated when bg-main was last lightened - worth a follow-up fix."
      }
    ]
  },
  {
    title: 'Accent & semantic surfaces',
    tokens: [
      { token: 'cta-primary', className: 'bg-cta-primary', hex: '#E07A5F', usage: 'Primary CTA fill - never use as text colour' },
      { token: 'accent-secondary', className: 'bg-accent-secondary', hex: '#F4B6A0', usage: 'Secondary accent surface (active card highlight, tints)' },
      { token: 'accent-tertiary', className: 'bg-accent-tertiary', hex: '#0B3D5B', usage: 'Dark surface, default link colour, outline-button border/text' },
      { token: 'alert', className: 'bg-alert', hex: '#F2CC8F', usage: 'Alert banner surface' },
      { token: 'success', className: 'bg-success', hex: '#81B29A', usage: 'Success banner surface' }
    ]
  }
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-bold text-text-primary mb-4 pb-2 border-b border-border-hairline">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Design System</h1>
          <p className="font-body text-text-secondary max-w-2xl">
            The live tokens and components Friday is built from. New features should
            default to what&apos;s here rather than inventing new patterns - if
            something genuinely doesn&apos;t fit, add it here too so this stays the
            source of truth. Full WCAG 2.1 AA contrast audit lives at{' '}
            <code className="font-mono text-sm bg-bg-surface px-1.5 py-0.5 rounded border border-border-hairline">
              docs/text-colour-hierarchy-system.md
            </code>{' '}
            in the repo.
          </p>
          <Link href="/dashboard" className="font-body text-text-link hover:text-text-cta font-medium mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>

        <Section title="Color tokens">
          {colorGroups.map(group => (
            <div key={group.title} className="mb-8 last:mb-0">
              <h3 className="font-display text-sm font-bold text-text-secondary uppercase tracking-wide mb-3">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.tokens.map(t => (
                  <div key={t.token} className="flex gap-3 bg-bg-surface rounded-lg border border-border-hairline p-3">
                    <div
                      className={`w-12 h-12 rounded-md shrink-0 border border-border-hairline ${t.className}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-text-primary">{t.token}</p>
                      <p className="font-mono text-xs text-text-secondary">{t.hex}</p>
                      <p className="font-body text-xs text-text-secondary mt-1">{t.usage}</p>
                      {t.flag && (
                        <p className="font-body text-xs text-text-cta mt-1">⚠ {t.flag}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-3 bg-bg-surface rounded-lg border border-border-hairline p-3 sm:w-1/2">
            <div className="w-12 h-12 rounded-md shrink-0 border-2" style={{ borderColor: 'var(--color-border-hairline)', background: 'transparent' }} />
            <div>
              <p className="font-mono text-sm font-bold text-text-primary">border-hairline</p>
              <p className="font-mono text-xs text-text-secondary">rgba(61, 64, 91, 0.14)</p>
              <p className="font-body text-xs text-text-secondary mt-1">Default card/input/divider border</p>
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <p className="font-body text-sm text-text-secondary mb-4">
            <span className="font-mono">font-display</span> (Epilogue, weights 500/600/700) for headings and button
            labels. <span className="font-mono">font-body</span> (Rosario, weights 400/500/600) for everything else.
          </p>
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6 space-y-4">
            <h1 className="font-display text-4xl font-bold text-text-primary">H1 - Page title</h1>
            <h2 className="font-display text-2xl font-bold text-text-primary">H2 - Section heading</h2>
            <h3 className="font-display text-lg font-bold text-text-primary">H3 - Card/panel heading</h3>
            <p className="font-body text-text-primary">
              Body text uses text-primary at full weight - this is the default for anything a user needs to read
              carefully.
            </p>
            <p className="font-body text-sm text-text-secondary">
              Secondary body text (text-secondary) - de-emphasised but still substantive: captions, hints,
              descriptions under a heading.
            </p>
            <p className="font-body text-xs text-text-disabled">
              Disabled text (text-disabled) - always paired with a disabled control, never colour alone.
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6 flex flex-wrap items-center gap-4">
            <button className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition">
              Primary CTA
            </button>
            <button className="font-body px-6 py-3 bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition">
              Secondary (outline)
            </button>
            <button disabled className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold opacity-50 cursor-not-allowed">
              Disabled
            </button>
            <button className="font-body text-text-link hover:text-text-cta font-medium">
              Text link →
            </button>
          </div>
          <p className="font-body text-xs text-text-secondary mt-2">
            Primary CTA labels must render ≥14px bold - it&apos;s the only combination that clears AA-large contrast
            on the cta-primary fill (see the audit doc, §4.6). Never shrink a primary-CTA label below that.
          </p>
        </Section>

        <Section title="Badges & status">
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6 flex flex-wrap items-center gap-3">
            <span className="font-body text-xs px-2 py-1 bg-bg-main rounded text-text-secondary border border-border-hairline">Draft</span>
            <span className="font-body text-xs px-2 py-1 bg-success/20 rounded text-text-on-success font-medium">Applied</span>
            <span className="font-body text-xs px-2 py-1 bg-accent-secondary/30 rounded text-text-primary font-medium">Interviewing</span>
            <span className="font-body text-xs px-2 py-1 bg-success/30 rounded text-text-on-success font-medium">Offer</span>
            <span className="font-body text-xs px-2 py-1 bg-cta-primary/10 rounded text-text-cta font-medium">Rejected</span>
          </div>
        </Section>

        <Section title="Cards">
          <div className="flex flex-wrap gap-3">
            <div className="font-body min-w-[200px] px-4 py-3 rounded-lg border-2 border-accent-tertiary bg-accent-secondary/15">
              <div className="flex items-start gap-2">
                <span className="font-body text-xs font-bold text-accent-tertiary mt-0.5">1.</span>
                <div>
                  <p className="font-semibold text-sm text-text-primary">Selected card</p>
                  <p className="text-xs text-text-secondary mt-0.5">Analyzed · 82/100</p>
                </div>
              </div>
            </div>
            <div className="font-body min-w-[200px] px-4 py-3 rounded-lg border-2 border-border-hairline bg-bg-surface hover:border-accent-tertiary/50 transition">
              <div className="flex items-start gap-2">
                <span className="font-body text-xs font-bold text-accent-tertiary mt-0.5">2.</span>
                <div>
                  <p className="font-semibold text-sm text-text-primary">Unselected card</p>
                  <p className="text-xs text-text-secondary mt-0.5">Draft · 2h ago</p>
                </div>
              </div>
            </div>
            <div className="font-body min-w-[140px] px-4 py-3 rounded-lg border-2 border-dashed border-border-hairline text-sm font-semibold text-text-secondary flex items-center justify-center">
              + New
            </div>
          </div>
          <p className="font-body text-xs text-text-secondary mt-2">
            Numbered, selectable card list - used for &quot;My CVs&quot; and &quot;My Cover Letters&quot;. Selected state
            uses accent-tertiary border + accent-secondary/15 tint; the trailing dashed card is always the add-new action.
          </p>
        </Section>

        <Section title="Declared value + edit">
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6">
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-text-secondary">I want to be</span>
              <span className="font-body text-sm font-bold text-text-primary">Camera Trainee</span>
              <button className="text-text-secondary hover:text-text-primary p-0.5" aria-label="Edit" title="Edit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          <p className="font-body text-xs text-text-secondary mt-2">
            Once a value has been declared, show it settled with a pencil-edit affordance rather than leaving an
            open input sitting there indefinitely. Same interaction as CV/cover-letter renaming.
          </p>
        </Section>

        <Section title="Form fields">
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6 space-y-4 max-w-md">
            <div>
              <label className="font-body text-sm font-semibold text-text-primary block mb-1">Label</label>
              <input
                type="text"
                placeholder="Placeholder text"
                className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
              />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-text-primary block mb-1">Textarea</label>
              <textarea
                placeholder="Paste content here..."
                rows={3}
                className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-text-cta block mb-1">Error state</label>
              <input
                type="text"
                defaultValue="Invalid value"
                className="font-body w-full px-3 py-2 border border-text-cta rounded-lg bg-bg-main text-text-primary text-sm"
              />
              <p className="font-body text-xs text-text-cta mt-1">Error message text uses text-cta, on bg-main/bg-surface only.</p>
            </div>
          </div>
        </Section>

        <Section title="Collapsible section">
          <details className="group bg-bg-surface rounded-lg border border-border-hairline overflow-hidden max-w-md">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-bg-main transition">
              <span className="font-body text-sm font-medium text-text-link">Add more detail (optional)</span>
              <svg className="w-4 h-4 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <p className="font-body text-sm text-text-secondary">Revealed content sits here.</p>
            </div>
          </details>
        </Section>

        <Section title="Banners">
          <div className="space-y-3">
            <div className="bg-alert rounded-lg p-4">
              <p className="font-body text-sm text-text-on-alert">Alert banner - surface: alert, text: text-on-alert.</p>
            </div>
            <div className="bg-success/15 border border-success/30 rounded-lg p-4">
              <p className="font-body text-sm text-text-on-success">Success banner (inline tint) - text: text-on-success.</p>
            </div>
            <div className="bg-cta-primary/10 border border-cta-primary/30 rounded-lg p-3 flex items-start gap-2">
              <span className="text-text-cta text-sm mt-0.5" aria-hidden="true">⚠</span>
              <p className="font-body text-sm text-text-cta">Inline error/warning message - text: text-cta.</p>
            </div>
          </div>
        </Section>

        <Section title="Brand assets">
          <div className="bg-bg-surface rounded-lg border border-border-hairline p-6 flex items-center gap-6">
            <Image src="/friday-logo.png" alt="Friday logo" width={64} height={64} />
            <div>
              <p className="font-body text-sm text-text-primary font-semibold">/public/friday-logo.png</p>
              <p className="font-body text-xs text-text-secondary mt-1">
                Also the favicon source (app/icon.png). Current in-app usage is a small (24-28px) icon next to the
                &quot;Friday&quot;/product wordmark - see app/page.tsx, app/dashboard/page.tsx, app/pricing/PricingContent.tsx.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
