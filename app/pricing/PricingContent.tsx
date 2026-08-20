'use client';

import { useState } from 'react';
import Link from 'next/link';

type Frequency = 'monthly' | 'yearly';

interface Tier {
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyBilledLabel?: string;
  cta: string;
  mostPopular?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    tagline: 'Try before you commit',
    monthlyPrice: 0,
    cta: 'Get Started with Free',
    features: [
      '1 CV, with edits',
      'Basic CV templates',
      'AI-powered CV analysis',
      'Skills tracking'
    ]
  },
  {
    name: 'Starter',
    tagline: 'Build and practice without limits',
    monthlyPrice: 10,
    yearlyBilledLabel: 'Billed $96 / year',
    cta: 'Get Started with Starter',
    mostPopular: true,
    features: [
      'Everything in Free',
      '3 different CVs, unlimited refinements',
      'Custom CV templates',
      'Written interview practice',
      'AI-powered feedback',
      'Progress tracking over time'
    ]
  },
  {
    name: 'Pro',
    tagline: 'Full interview readiness',
    monthlyPrice: 15,
    yearlyBilledLabel: 'Billed $144 / year',
    cta: 'Get Started with Pro',
    features: [
      'Everything in Starter',
      'Phone call interview practice',
      'Voice-based AI feedback',
      'Priority support'
    ]
  }
];

const FAQ = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes — you can upgrade or downgrade at any time from your account settings.'
  },
  {
    q: "What's the difference between Starter and Pro?",
    a: 'Starter covers CV building and written interview practice. Pro adds phone-call-style interview practice with real-time voice feedback.'
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'The Free plan lets you try the core CV tools before subscribing — no time limit, no credit card required.'
  }
];

export default function PricingContent() {
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-display text-2xl font-bold text-text-primary">
            Friday
          </Link>
          <Link
            href="/login"
            className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-3 inline-block bg-accent-tertiary/10 text-accent-tertiary text-xs font-bold px-3 py-1 rounded-full">
          DEV ONLY — not linked from the live app
        </div>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-4">
            Pricing for every film career
          </h1>
          <p className="font-body text-lg text-text-secondary">
            Start free, upgrade when you&apos;re ready to practice for the real thing.
          </p>
        </div>

        {/* Frequency toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span
            className={`font-body text-sm ${frequency === 'monthly' ? 'text-text-primary font-bold' : 'text-text-secondary'}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setFrequency(frequency === 'monthly' ? 'yearly' : 'monthly')}
            role="switch"
            aria-checked={frequency === 'yearly'}
            aria-label="Toggle payment frequency"
            className="relative w-12 h-6 rounded-full bg-accent-tertiary transition"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg-surface transition-transform ${
                frequency === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span
            className={`font-body text-sm ${frequency === 'yearly' ? 'text-text-primary font-bold' : 'text-text-secondary'}`}
          >
            Yearly
          </span>
          <span className="font-body text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
            Save up to 20%
          </span>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-bg-surface rounded-lg p-6 border ${
                tier.mostPopular ? 'border-accent-tertiary border-2' : 'border-border-hairline'
              }`}
            >
              {tier.mostPopular && (
                <span className="absolute -top-3 left-6 bg-accent-tertiary text-text-on-tertiary text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h2 className="font-display text-xl font-bold text-text-primary mb-1">{tier.name}</h2>
              <p className="font-body text-sm text-text-secondary mb-4">{tier.tagline}</p>

              <div className="mb-1">
                <span className="font-display text-4xl font-bold text-text-primary">
                  ${tier.monthlyPrice}
                </span>
                <span className="font-body text-text-secondary"> / mo</span>
              </div>
              <p className="font-body text-xs text-text-secondary mb-6 h-4">
                {frequency === 'yearly' && tier.yearlyBilledLabel ? tier.yearlyBilledLabel : ' '}
              </p>

              <button
                className={`w-full py-3 rounded-lg font-bold font-body mb-6 transition hover:opacity-90 ${
                  tier.mostPopular
                    ? 'bg-cta-primary text-text-on-cta'
                    : 'bg-bg-main text-text-primary border border-border-hairline'
                }`}
              >
                {tier.cta}
              </button>

              <p className="font-body text-xs font-bold text-text-secondary mb-3 uppercase tracking-wide">
                What&apos;s included
              </p>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="font-body text-sm text-text-primary flex items-start gap-2">
                    <span className="text-success mt-0.5" aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-text-primary text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-bg-surface rounded-lg p-5 border border-border-hairline">
                <p className="font-body font-bold text-text-primary mb-1">{item.q}</p>
                <p className="font-body text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-text-secondary text-center mt-8">
            Have more questions? {' '}
            <a href="mailto:support@intentionaut.com" className="text-text-link underline">
              support@intentionaut.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
