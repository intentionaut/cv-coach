'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import BetaSignup from '@/components/marketing/BetaSignup';
import { GoogleIcon } from '@/components/ui/icons';

/**
 * One auth surface, two doors.
 *
 * Friday is invite-only, so this page serves two people who look identical on
 * arrival: someone who already has an account, and someone who wants one and
 * can't have it yet. Splitting them across two pages meant the second group
 * hit a form they couldn't use and left.
 *
 * A segmented control rather than a link buried under the form: both paths
 * are equally legitimate here, and the convention people already know from
 * every other signed-out page is a visible pair of tabs.
 *
 * Which tab opens is driven by where they came from - `?join=1` on every
 * marketing CTA - so intent survives the click instead of making them choose
 * again. Header "Sign in" lands on sign-in, as the label promises.
 */

type Tab = 'signin' | 'join';

function LoginContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get('join') ? 'join' : 'signin');

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Could not reach Google. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        // Deliberately doesn't say which of the two was wrong - that would
        // confirm to a stranger whether an address has an account here.
        setError('Incorrect email or password.');
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <Image src="/friday-logo.png" alt="" width={32} height={32} />
        <span className="font-display text-2xl font-bold text-text-primary">Friday</span>
      </Link>

      <div className="bg-bg-surface rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        {/* Segmented control. role="tablist" so it's announced as a choice
            rather than two loose buttons. */}
        <div
          role="tablist"
          aria-label="Sign in or request access"
          className="flex p-1 bg-bg-main rounded-lg mb-6"
        >
          <TabButton active={tab === 'signin'} onClick={() => setTab('signin')} controls="panel-signin">
            Sign in
          </TabButton>
          <TabButton active={tab === 'join'} onClick={() => setTab('join')} controls="panel-join">
            Request access
          </TabButton>
        </div>

        {tab === 'signin' ? (
          <div id="panel-signin" role="tabpanel">
            <h1 className="font-display text-xl font-bold text-text-primary mb-1">Welcome back</h1>
            <p className="font-body text-sm text-text-secondary mb-6">
              Pick up where you left off.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="font-body w-full flex items-center justify-center gap-3 bg-bg-surface border-2 border-border-hairline text-text-primary py-3 px-4 rounded-lg font-medium hover:bg-bg-main transition disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <span className="h-px flex-1 bg-border-hairline" />
              <span className="font-body text-xs text-text-secondary">or</span>
              <span className="h-px flex-1 bg-border-hairline" />
            </div>

            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="font-body text-sm font-semibold text-text-primary block mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  placeholder="you@example.com"
                  className="font-body w-full px-3 py-2.5 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="font-body text-sm font-semibold text-text-primary block mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!error}
                    className="font-body w-full px-3 py-2.5 pr-16 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="font-body absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="font-body text-sm text-text-cta">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="font-body w-full px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="font-body text-sm text-text-secondary mt-5">
              Haven&apos;t got an account?{' '}
              <button
                onClick={() => setTab('join')}
                className="text-text-link underline font-medium"
              >
                Ask for beta access
              </button>
              .
            </p>
          </div>
        ) : (
          <div id="panel-join" role="tabpanel">
            <h1 className="font-display text-xl font-bold text-text-primary mb-1">
              Ask for beta access
            </h1>
            <p className="font-body text-sm text-text-secondary mb-6">
              Friday is invite-only while it&apos;s early. We&apos;re letting people in a
              handful at a time so we can read what everyone sends back.
            </p>

            <BetaSignup source="login" />

            <p className="font-body text-sm text-text-secondary mt-5">
              Already have an account?{' '}
              <button
                onClick={() => setTab('signin')}
                className="text-text-link underline font-medium"
              >
                Sign in
              </button>
              .
            </p>
          </div>
        )}
      </div>

      <p className="font-body mt-6 text-center text-xs text-text-secondary max-w-md">
        By using Friday, you agree to our{' '}
        <Link href="/terms" className="text-text-link underline">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-text-link underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  controls,
  children
}: {
  active: boolean;
  onClick: () => void;
  controls: string;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`font-body flex-1 px-4 py-2 rounded-md text-sm font-semibold transition ${
        active
          ? 'bg-bg-surface text-text-primary shadow-sm'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
      <LoginContent />
    </Suspense>
  );
}
