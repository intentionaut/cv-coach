'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isOwner } from '@/lib/flags';

/**
 * Owner-only metrics.
 *
 * Three questions, in the order they'd kill the business: can we afford to
 * run it, does it get people applying, and does applying through Friday work
 * better than not. Everything here comes from Postgres - Mixpanel answers a
 * different question (where people click) and drops events to ad blockers.
 */

interface Metrics {
  spend: {
    total: number;
    last30d: number;
    last7d: number;
    wasted: number;
    calls: number;
    since: string | null;
    bySurface: Array<{ surface: string; calls: number; cost: number; avg_cost: number }>;
    byTier: Array<{ tier: string; calls: number; cost: number; avg_cost: number }>;
    perUser: { users: number; mean: number; p50: number; p90: number; max: number };
    costPerActivatedUser: number | null;
  };
  funnel: {
    signedUp: number;
    uploadedCv: number;
    analysedCv: number;
    wroteLetter: number;
    applied: number;
    practised: number;
    uploadToApplied: number | null;
  };
  outcomes: {
    applications: number;
    reached_interview: number;
    offers: number;
    rejected: number;
    no_response: number;
    awaiting: number;
    interviewRate: number | null;
    offerRate: number | null;
    noResponseRate: number | null;
    applicationsPerApplicant: number | null;
  };
  effort: {
    cvs: number;
    analyses: number;
    letters: number;
    letters_never_sent: number;
    analysesPerCv: number | null;
  };
}

const usd = (n: number) =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`.replace(/0+$/, '').replace(/\.$/, '');

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);

function AdminMetricsContent() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
        return res.json();
      })
      .then(setMetrics)
      .catch(err => setError(err.message));
  }, []);

  if (!isOwner(session?.user?.email)) {
    return (
      <div className="min-h-screen bg-bg-main">
        <div className="container mx-auto px-4 py-8">
          <p className="font-body text-text-secondary">Not authorized.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main">
        <div className="container mx-auto px-4 py-8">
          <p className="font-body text-text-cta">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return <div className="min-h-screen bg-bg-main" />;

  const { spend, funnel, outcomes, effort } = metrics;

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Metrics</h1>
          <p className="font-body text-text-secondary">
            Owner only. Costs are metered from{' '}
            {spend.since
              ? new Date(spend.since).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'the first AI call'}{' '}
            — anything earlier was never recorded.
          </p>
        </div>

        {/* 1. Can we afford to run it */}
        <Section title="Unit economics" note="The question that decides whether Friday works as a business.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Spend, last 30 days" value={usd(spend.last30d)} />
            <Stat label="Last 7 days" value={usd(spend.last7d)} />
            <Stat
              label="Cost per applying user"
              value={spend.costPerActivatedUser === null ? '—' : usd(spend.costPerActivatedUser)}
              note="All spend ÷ users who've applied. What a subscription has to cover."
            />
            <Stat
              label="Spend on failed calls"
              value={usd(spend.wasted)}
              note="Errored or truncated. Billed anyway."
              tone={spend.wasted > spend.total * 0.05 ? 'warn' : 'normal'}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Stat label="Median user" value={usd(spend.perUser.p50)} />
            <Stat
              label="P90 user"
              value={usd(spend.perUser.p90)}
              note="Sets your tier limits. The mean hides this person."
            />
            <Stat label="Most expensive user" value={usd(spend.perUser.max)} />
            <Stat label="Total calls" value={spend.calls.toLocaleString()} />
          </div>

          <Table
            caption="By surface"
            head={['Surface', 'Calls', 'Total', 'Avg']}
            rows={spend.bySurface.map(r => [
              r.surface.replace(/_/g, ' '),
              r.calls.toLocaleString(),
              usd(r.cost),
              usd(r.avg_cost)
            ])}
          />
          <Table
            caption="By tier"
            head={['Tier', 'Calls', 'Total', 'Avg']}
            rows={spend.byTier.map(r => [
              r.tier,
              r.calls.toLocaleString(),
              usd(r.cost),
              usd(r.avg_cost)
            ])}
          />
        </Section>

        {/* 2. Does it get people applying */}
        <Section title="Funnel" note="Users reaching each stage. Upload → applied is whether the product does its job.">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Stat label="Signed up" value={funnel.signedUp} />
            <Stat label="Uploaded a CV" value={funnel.uploadedCv} />
            <Stat label="Got analysis" value={funnel.analysedCv} />
            <Stat label="Wrote a letter" value={funnel.wroteLetter} />
            <Stat label="Applied" value={funnel.applied} />
            <Stat label="Practised" value={funnel.practised} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Stat
              label="Upload → applied"
              value={pct(funnel.uploadToApplied)}
              note="The headline conversion."
            />
            <Stat
              label="Applications per applicant"
              value={
                outcomes.applicationsPerApplicant === null
                  ? '—'
                  : outcomes.applicationsPerApplicant.toFixed(1)
              }
              note="Near 1.0 means a one-off tool, not a habit."
            />
            <Stat
              label="Letters never sent"
              value={effort.letters_never_sent}
              note="Written, then not applied with."
            />
          </div>
        </Section>

        {/* 3. Does it actually work */}
        <Section title="Outcomes" note="The only evidence the coaching works rather than just gets used. Needs volume before it means anything.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Applications sent" value={outcomes.applications} />
            <Stat label="Reached interview" value={outcomes.reached_interview} />
            <Stat label="Offers" value={outcomes.offers} />
            <Stat label="Awaiting a reply" value={outcomes.awaiting} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Stat label="Interview rate" value={pct(outcomes.interviewRate)} note="The number worth showing a film school." />
            <Stat label="Offer rate" value={pct(outcomes.offerRate)} />
            <Stat label="No response" value={pct(outcomes.noResponseRate)} note="Kept separate from rejected on purpose." />
            <Stat label="Rejected" value={outcomes.rejected} />
          </div>
        </Section>

        <Section title="Effort" note="What gets produced, and how often it gets redone.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="CVs" value={effort.cvs} />
            <Stat label="Analyses run" value={effort.analyses} />
            <Stat
              label="Analyses per CV"
              value={effort.analysesPerCv === null ? '—' : effort.analysesPerCv.toFixed(1)}
              note="Uncapped on paid tiers. Where cost runs away."
              tone={(effort.analysesPerCv ?? 0) > 5 ? 'warn' : 'normal'}
            />
            <Stat label="Cover letters" value={effort.letters} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  note,
  children
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-text-primary mb-1">{title}</h2>
      <p className="font-body text-sm text-text-secondary mb-4 max-w-3xl">{note}</p>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  tone = 'normal'
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: 'normal' | 'warn';
}) {
  return (
    <div className="bg-bg-surface border border-border-hairline rounded-lg p-4">
      <p className="font-body text-xs text-text-secondary mb-1">{label}</p>
      <p
        className={`font-display text-2xl font-bold tabular-nums ${
          tone === 'warn' ? 'text-text-cta' : 'text-text-primary'
        }`}
      >
        {value}
      </p>
      {note && <p className="font-body text-xs text-text-secondary mt-1.5">{note}</p>}
    </div>
  );
}

function Table({
  caption,
  head,
  rows
}: {
  caption: string;
  head: string[];
  rows: Array<Array<string | number>>;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
        {caption}
      </p>
      <div className="overflow-x-auto bg-bg-surface border border-border-hairline rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-hairline">
              {head.map((h, i) => (
                <th
                  key={h}
                  className={`font-body text-xs font-semibold text-text-secondary px-4 py-2 ${
                    i === 0 ? 'text-left' : 'text-right'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border-hairline last:border-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`font-body text-text-primary px-4 py-2 ${
                      j === 0 ? 'text-left capitalize' : 'text-right tabular-nums'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminMetricsPage() {
  return (
    <ProtectedRoute>
      <AdminMetricsContent />
    </ProtectedRoute>
  );
}
