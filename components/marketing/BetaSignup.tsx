'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EVENTS, track } from '@/lib/analytics/events';

/**
 * Private beta signup.
 *
 * Two fields, as in the original draft: an email, and where they are in their
 * search. The second one earns its place — it's the difference between "487
 * signups" and "most of these are final-year students, so build for them
 * first", and it costs one dropdown.
 *
 * Asking for a name would be a third field for something we don't need, and
 * every field costs conversions. Two is the limit.
 *
 * `source` is passed by the page, so we learn which story actually persuades
 * people rather than guessing.
 */

const STAGES = [
  'Final year student',
  'Recently graduated',
  'Between productions',
  'Actively interviewing',
  'Just curious'
];

export default function BetaSignup({
  source,
  tone = 'light'
}: {
  /** Which page this sits on — 'home', 'login', 'product/improve-your-cv'. */
  source: string;
  /** 'dark' when sitting on the navy surface. */
  tone?: 'light' | 'dark';
}) {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const dark = tone === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('saving');
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, stage: stage || undefined, source })
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.');
        setStatus('idle');
        return;
      }
      track(EVENTS.BETA_SIGNUP, { source, hasStage: !!stage });
      setStatus('done');
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div
        className={`rounded-lg p-6 ${
          dark ? 'bg-text-inverse/10 border border-text-inverse/20' : 'bg-bg-surface border border-border-hairline'
        }`}
      >
        <p className={`font-display text-lg font-bold mb-1 ${dark ? 'text-text-on-tertiary' : 'text-text-primary'}`}>
          You&apos;re on the list.
        </p>
        <p className={`font-body text-sm ${dark ? 'text-text-inverse/75' : 'text-text-secondary'}`}>
          We&apos;re letting people in a handful at a time so we can actually read what you
          send back. You&apos;ll get an email when it&apos;s your turn.
        </p>
      </div>
    );
  }

  const fieldClass = `font-body w-full px-3 py-2.5 rounded-lg text-sm border focus:ring-2 focus:ring-accent-tertiary focus:border-transparent ${
    dark
      ? 'bg-bg-surface border-transparent text-text-primary'
      : 'bg-bg-main border-border-hairline text-text-primary'
  }`;

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <div className="space-y-3">
        <div>
          <label
            htmlFor={`beta-email-${source}`}
            className={`font-body text-sm font-semibold block mb-1 ${dark ? 'text-text-on-tertiary' : 'text-text-primary'}`}
          >
            Email
          </label>
          <input
            id={`beta-email-${source}`}
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor={`beta-stage-${source}`}
            className={`font-body text-sm font-semibold block mb-1 ${dark ? 'text-text-on-tertiary' : 'text-text-primary'}`}
          >
            Where are you in your search?
          </label>
          <select
            id={`beta-stage-${source}`}
            value={stage}
            onChange={e => setStage(e.target.value)}
            className={fieldClass}
          >
            <option value="">Rather not say</option>
            {STAGES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className={`font-body text-sm ${dark ? 'text-accent-secondary' : 'text-text-cta'}`}>{error}</p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="font-body w-full px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {status === 'saving' ? 'Just a moment...' : 'Join the beta'}
        </button>

        {/* Consent has to be explicit, not implied by a button — this is a UK
            and EU audience. Kept to one line so it reads as a promise rather
            than a disclaimer. */}
        <p className={`font-body text-xs ${dark ? 'text-text-inverse/70' : 'text-text-secondary'}`}>
          We&apos;ll email you about beta access and nothing else. No newsletter you
          didn&apos;t ask for, and you can leave at any time.{' '}
          <Link
            href="/privacy"
            className={`underline ${dark ? 'text-text-on-tertiary' : 'text-text-link'}`}
          >
            How we handle your data
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
