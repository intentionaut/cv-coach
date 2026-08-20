'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Incorrect email or password.');
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="bg-bg-surface rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="font-body w-full flex items-center justify-center gap-3 bg-bg-surface border-2 border-border-hairline text-text-primary py-3 px-4 rounded-lg font-medium hover:bg-bg-main transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-hairline" />
            <span className="font-body text-xs text-text-secondary">or</span>
            <div className="flex-1 h-px bg-border-hairline" />
          </div>

          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-surface focus:outline-none focus:border-accent-tertiary"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-surface focus:outline-none focus:border-accent-tertiary"
            />
            {error && (
              <p className="font-body text-sm text-text-cta">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="font-body w-full bg-cta-primary text-text-on-cta py-3 px-4 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in with Password'}
            </button>
          </form>
        </div>

        <div className="font-body mt-8 text-center text-xs text-text-secondary">
          <p>
            By using Friday, you agree to our{' '}
            <a href="/terms" className="text-text-link underline">
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-text-link underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
