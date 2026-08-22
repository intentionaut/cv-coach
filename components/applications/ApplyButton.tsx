'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENTS, track } from '@/lib/analytics/events';

/**
 * "I applied" - the only way an application gets created.
 *
 * It asks exactly one question, and only because that answer is the one piece
 * of structured data we can't derive: who received it. The role, job
 * description and CV all come across from whatever this was triggered from.
 * When the source already knows the company (a cover letter does), the field
 * is prefilled and confirming is a single click.
 *
 * It stays one question. The moment this grows a date picker and a notes box
 * it stops being the end of a coaching flow and starts being a worse version
 * of a job board's tracker.
 */
export default function ApplyButton({
  cvId,
  coverLetterId,
  jobTitle,
  defaultCompany = '',
  variant = 'primary',
  onApplied
}: {
  cvId?: string;
  coverLetterId?: string;
  /** Used only to gate the control - the server derives the real value. */
  jobTitle?: string;
  defaultCompany?: string;
  variant?: 'primary' | 'secondary';
  onApplied?: (applicationId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(defaultCompany);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const canApply = !!jobTitle?.trim();

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvId,
          coverLetterId,
          companyName: company.trim() || undefined,
          jobTitle
        })
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.');
        return;
      }
      track(EVENTS.APPLICATION_SENT, {
        from: coverLetterId ? 'cover_letter' : 'cv',
        hasCompanyName: !!company.trim()
      });
      setApplicationId(result.applicationId);
      setOpen(false);
      onApplied?.(result.applicationId);
    } catch (err) {
      console.error('Failed to record application:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (applicationId) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <p className="font-body text-sm text-text-primary font-semibold">
          <span aria-hidden="true">✓</span> Logged as applied
        </p>
        <button
          onClick={() => router.push(`/applications?id=${applicationId}`)}
          className="font-body text-sm text-text-link hover:underline"
        >
          Tell us how it goes &rarr;
        </button>
      </div>
    );
  }

  // Backing out is tracked, not ignored - see APPLICATION_ABANDONED.
  const handleCancel = () => {
    setOpen(false);
    track(EVENTS.APPLICATION_ABANDONED, {
      from: coverLetterId ? 'cover_letter' : 'cv',
      hadTypedCompany: !!company.trim()
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={!canApply}
        title={canApply ? undefined : 'Set the role this CV is for first'}
        className={
          variant === 'primary'
            ? 'font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50'
            : 'font-body px-6 py-3 bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition disabled:opacity-50'
        }
      >
        I applied
      </button>
    );
  }

  return (
    <div className="w-full bg-bg-main border border-border-hairline rounded-lg p-4">
      <label
        htmlFor="apply-company"
        className="font-body text-sm font-semibold text-text-primary block mb-0.5"
      >
        Who did you send it to?
      </label>
      <p className="font-body text-xs text-text-secondary mb-2">
        The company or production. Skip it if you&apos;d rather not say.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          id="apply-company"
          type="text"
          autoFocus
          value={company}
          onChange={e => setCompany(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') handleCancel();
          }}
          placeholder="Company or production"
          className="font-body flex-1 min-w-[200px] px-3 py-2 border border-border-hairline rounded-lg bg-bg-surface text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
        />
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="font-body px-6 py-2 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
        <button
          onClick={handleCancel}
          className="font-body px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition"
        >
          Cancel
        </button>
      </div>
      {error && <p className="font-body text-sm text-text-cta mt-2">{error}</p>}
    </div>
  );
}
