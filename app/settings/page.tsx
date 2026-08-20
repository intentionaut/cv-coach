'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

function SettingsContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
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
      const res = await fetch('/api/user/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to set password.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Set password error:', err);
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-surface rounded-lg shadow p-6 max-w-md">
          <h2 className="font-display text-lg font-bold text-text-primary mb-2">
            Set / Change Password
          </h2>
          <p className="font-body text-sm text-text-secondary mb-6">
            Add a password to sign in without Google, or update your existing one.
          </p>

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
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
            />

            {error && <p className="font-body text-sm text-text-cta">{error}</p>}
            {status === 'success' && (
              <p className="font-body text-sm text-success">Password updated.</p>
            )}

            <button
              type="submit"
              disabled={status === 'saving'}
              className="font-body w-full bg-cta-primary text-text-on-cta py-3 px-4 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'saving' ? 'Saving...' : 'Save Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
