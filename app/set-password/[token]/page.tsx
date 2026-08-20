'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('saving');
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'This link is invalid or has expired.');
        setStatus('error');
        return;
      }

      // Redirect to login with the password form ready to go
      router.push('/login?passwordSet=1');
    } catch (err) {
      console.error('Set password error:', err);
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="bg-bg-surface rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Set Your Password
          </h1>
          <p className="font-body text-text-secondary text-sm">
            Choose a password to sign in to Friday.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
          />
          <input
            type="password"
            required
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
          />

          {error && <p className="font-body text-sm text-text-cta">{error}</p>}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="font-body w-full bg-cta-primary text-text-on-cta py-3 px-4 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'saving' ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
