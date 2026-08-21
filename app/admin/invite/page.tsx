'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ADMIN_EMAIL = 'dasilvasaielle@gmail.com';

function InviteContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const [tierEmail, setTierEmail] = useState('');
  const [tier, setTier] = useState<'free' | 'starter' | 'pro'>('pro');
  const [tierStatus, setTierStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [tierError, setTierError] = useState('');

  if (status === 'loading') {
    return null;
  }

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
        <p className="font-body text-text-secondary">Not authorized.</p>
      </div>
    );
  }

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTierError('');
    setTierStatus('sending');

    try {
      const res = await fetch('/api/admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tierEmail, tier })
      });

      const data = await res.json();

      if (!res.ok) {
        setTierError(data.error || 'Failed to update tier.');
        setTierStatus('error');
        return;
      }

      setTierStatus('success');
      setTierEmail('');
    } catch (err) {
      console.error('Set tier error:', err);
      setTierError('Something went wrong. Please try again.');
      setTierStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteStatus('sending');

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invite.');
        setInviteStatus('error');
        return;
      }

      setInviteStatus('success');
      setEmail('');
      setName('');
    } catch (err) {
      console.error('Invite error:', err);
      setError('Something went wrong. Please try again.');
      setInviteStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">Invite a User</h1>
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
          <p className="font-body text-sm text-text-secondary mb-6">
            Sends a one-time link (valid 24 hours) for the recipient to set their
            own password. If the email doesn&apos;t match an existing account, a new
            one is created.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
            />

            {error && <p className="font-body text-sm text-text-cta">{error}</p>}
            {inviteStatus === 'success' && (
              <p className="font-body text-sm text-success">Invite sent.</p>
            )}

            <button
              type="submit"
              disabled={inviteStatus === 'sending'}
              className="font-body w-full bg-cta-primary text-text-on-cta py-3 px-4 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

        <div className="bg-bg-surface rounded-lg shadow p-6 max-w-md mt-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-2">Set User Tier</h2>
          <p className="font-body text-sm text-text-secondary mb-6">
            Changes an existing user&apos;s pricing tier immediately.
          </p>

          <form onSubmit={handleTierSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={tierEmail}
              onChange={(e) => setTierEmail(e.target.value)}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
            />
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as 'free' | 'starter' | 'pro')}
              className="font-body w-full border-2 border-border-hairline rounded-lg py-3 px-4 text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>

            {tierError && <p className="font-body text-sm text-text-cta">{tierError}</p>}
            {tierStatus === 'success' && (
              <p className="font-body text-sm text-success">Tier updated.</p>
            )}

            <button
              type="submit"
              disabled={tierStatus === 'sending'}
              className="font-body w-full bg-cta-primary text-text-on-cta py-3 px-4 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tierStatus === 'sending' ? 'Updating...' : 'Update Tier'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AdminInvitePage() {
  return (
    <ProtectedRoute>
      <InviteContent />
    </ProtectedRoute>
  );
}
