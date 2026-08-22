'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { formatRelativeTime } from '@/lib/format';
import { EVENTS, track } from '@/lib/analytics/events';
import { STATUS_LABELS, OUTCOME_STATUSES, type ApplicationStatus } from '@/lib/applications';

/**
 * What you've applied for, and how it went.
 *
 * There is no "add an application" here on purpose. Applications are created
 * by clicking "I applied" on a CV or a cover letter, so this page can only
 * ever reflect work the user actually did in Friday - which is the whole
 * point of it. Manual entry would make this a job-search tracker competing
 * with platforms that already do it properly.
 *
 * So the page has two jobs: show what's been sent, and make it easy to say
 * what happened next.
 */

interface ApplicationListItem {
  id: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  cvId: string | null;
  cvName: string | null;
  letterCount: number;
  createdAt: string;
}

interface ApplicationDetail extends Omit<ApplicationListItem, 'letterCount'> {
  jobDescription: string;
  letters: Array<{ id: string; updatedAt: string }>;
}

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const companySaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadList = async (): Promise<ApplicationListItem[]> => {
    const response = await fetch('/api/applications');
    if (!response.ok) return [];
    const data = await response.json();
    setApplications(data.applications || []);
    return data.applications || [];
  };

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    const response = await fetch(`/api/applications/${id}`);
    if (!response.ok) return;
    setDetail(await response.json());
  };

  useEffect(() => {
    (async () => {
      const list = await loadList();
      // Arrival is the denominator for "did they come back and close the
      // loop" - Application Outcome Updated is meaningless without it.
      track(EVENTS.APPLICATIONS_VIEWED, {
        count: list.length,
        isEmpty: list.length === 0,
        awaitingReply: list.filter(a => a.status === 'applied').length
      });
      const idParam = searchParams.get('id');
      if (idParam) {
        await loadDetail(idParam);
      } else if (list.length > 0) {
        await loadDetail(list[0].id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!detail) return;
    const previous = detail.status;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) return;
      track(EVENTS.APPLICATION_OUTCOME_UPDATED, {
        from: previous,
        to: newStatus,
        isPositive: newStatus === 'interviewing' || newStatus === 'offer'
      });
      setDetail({ ...detail, status: newStatus });
      setApplications(prev =>
        prev.map(a => (a.id === detail.id ? { ...a, status: newStatus } : a))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSaving(false);
    }
  };

  // The one field worth correcting after the fact: who received it. Saved on
  // a debounce like every other inline edit in the app.
  const saveCompany = (value: string) => {
    if (!selectedId) return;
    if (companySaveTimeout.current) clearTimeout(companySaveTimeout.current);
    companySaveTimeout.current = setTimeout(() => {
      fetch(`/api/applications/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: value })
      })
        .then(() => {
          setApplications(prev =>
            prev.map(a => (a.id === selectedId ? { ...a, companyName: value } : a))
          );
        })
        .catch(err => console.error('Failed to save company:', err));
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this application? Your CV and any cover letter stay where they are.')) {
      return;
    }
    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!response.ok) return;
      track(EVENTS.APPLICATION_REMOVED, { hadOutcome: detail?.status !== 'applied' });
      const list = await loadList();
      if (list.length > 0) {
        await loadDetail(list[0].id);
      } else {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg-main" />;
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Applications</h1>
          <p className="font-body text-text-secondary">
            The roles you&apos;ve gone for, and what came back.
          </p>
        </div>

        {applications.length === 0 ? (
          <EmptyState onGoToCv={() => router.push('/cv')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {applications.map(app => {
                const isActive = app.id === selectedId;
                return (
                  <button
                    key={app.id}
                    onClick={() => loadDetail(app.id)}
                    className={`font-body w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                      isActive
                        ? 'border-accent-tertiary bg-accent-secondary/15'
                        : 'border-border-hairline bg-bg-surface hover:border-accent-tertiary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate">
                          {app.jobTitle}
                        </p>
                        {app.companyName && (
                          <p className="text-sm text-text-secondary truncate">{app.companyName}</p>
                        )}
                      </div>
                      <StatusPill status={app.status} />
                    </div>
                    {app.appliedAt && (
                      <p className="text-xs text-text-secondary mt-1.5">
                        Applied {formatRelativeTime(app.appliedAt)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3">
              {detail && (
                <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-bold text-text-primary break-words">
                        {detail.jobTitle}
                      </h2>
                      {detail.appliedAt && (
                        <p className="font-body text-sm text-text-secondary mt-0.5">
                          Applied {formatRelativeTime(detail.appliedAt)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(detail.id)}
                      className="font-body text-sm text-text-secondary hover:text-text-cta shrink-0"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="border-t border-border-hairline pt-5">
                    <p className="font-body text-sm font-semibold text-text-primary mb-1">
                      {STATUS_LABELS[detail.status]}
                    </p>
                    <p className="font-body text-xs text-text-secondary mb-2">Heard anything?</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {OUTCOME_STATUSES.filter(s => s !== detail.status).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={saving}
                          className="font-body px-3 py-1.5 text-xs font-semibold border border-border-hairline rounded-lg text-text-secondary hover:border-accent-tertiary hover:text-accent-tertiary transition disabled:opacity-50"
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border-hairline pt-5">
                    <label
                      htmlFor="company"
                      className="font-body text-sm font-semibold text-text-primary block mb-1"
                    >
                      Who you sent it to
                    </label>
                    <input
                      id="company"
                      type="text"
                      defaultValue={detail.companyName}
                      onChange={e => saveCompany(e.target.value)}
                      placeholder="Company or production"
                      className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-border-hairline pt-5">
                    <h3 className="font-display font-bold text-text-primary mb-3">What you sent</h3>
                    <ul className="space-y-2">
                      <li className="font-body text-sm text-text-secondary flex items-center justify-between gap-3">
                        <span>{detail.cvName ? `CV — ${detail.cvName}` : 'No CV attached'}</span>
                        {detail.cvId && (
                          <button
                            onClick={() => router.push('/cv')}
                            className="text-text-link hover:underline shrink-0"
                          >
                            Open
                          </button>
                        )}
                      </li>
                      {detail.letters.length > 0 && (
                        <li className="font-body text-sm text-text-secondary flex items-center justify-between gap-3">
                          <span>
                            {detail.letters.length} cover letter
                            {detail.letters.length === 1 ? '' : 's'}
                          </span>
                          <button
                            onClick={() =>
                              router.push(`/cover-letters?letterId=${detail.letters[0].id}`)
                            }
                            className="text-text-link hover:underline shrink-0"
                          >
                            Open
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The empty state does two jobs.
 *
 * It says what has to happen for this page to fill up - the page can't do
 * anything on its own, since applications only exist once the user says they
 * applied - and it shows the shape the page will take when it does, as a
 * skeleton of the real layout.
 *
 * The skeleton uses real labels for the fixed furniture (the outcome buttons,
 * the section headings) and grey bars only where the user's own content will
 * go. That's the difference between a placeholder that sets expectations and
 * one that just looks like something failed to load. It's inert and hidden
 * from assistive tech - the message above it already says everything.
 */
function EmptyState({ onGoToCv }: { onGoToCv: () => void }) {
  return (
    <div>
      <div className="max-w-2xl mb-8">
        <p className="font-body text-lg text-text-primary mb-4">
          When you&apos;ve applied and let us know, we&apos;ll help you keep track here.
        </p>
        <p className="font-body text-text-secondary mb-5">
          Hit <span className="font-semibold text-text-primary">I applied</span> on a CV or a
          cover letter and the role lands here. Come back to say how it went — over a few
          applications that&apos;s what tells you which version of your CV is actually working.
        </p>
        <button
          onClick={onGoToCv}
          className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition"
        >
          Go to your CV
        </button>
      </div>

      <div
        aria-hidden="true"
        inert
        className="grid grid-cols-1 lg:grid-cols-5 gap-6 opacity-45 select-none"
      >
        <div className="lg:col-span-2 space-y-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="px-4 py-3 rounded-lg border-2 border-dashed border-border-hairline bg-bg-surface"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <GhostBar className="h-3.5 w-2/3" />
                  <GhostBar className="h-3 w-1/2" />
                </div>
                <GhostBar className="h-5 w-16 rounded-full shrink-0" />
              </div>
              <GhostBar className="h-2.5 w-1/3 mt-3" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-bg-surface rounded-lg border-2 border-dashed border-border-hairline p-6 space-y-6">
            <div className="space-y-2">
              <GhostBar className="h-6 w-1/2" />
              <GhostBar className="h-3 w-1/4" />
            </div>

            <div className="border-t border-border-hairline pt-5">
              <p className="font-body text-xs text-text-secondary mb-2">Heard anything?</p>
              <div className="flex items-center gap-2 flex-wrap">
                {OUTCOME_STATUSES.map(s => (
                  <span
                    key={s}
                    className="font-body px-3 py-1.5 text-xs font-semibold border border-border-hairline rounded-lg text-text-secondary"
                  >
                    {STATUS_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-border-hairline pt-5">
              <p className="font-body text-sm font-semibold text-text-primary mb-1">
                Who you sent it to
              </p>
              <GhostBar className="h-9 w-full rounded-lg" />
            </div>

            <div className="border-t border-border-hairline pt-5">
              <p className="font-display font-bold text-text-primary mb-3">What you sent</p>
              <div className="space-y-2">
                <GhostBar className="h-3.5 w-3/5" />
                <GhostBar className="h-3.5 w-2/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GhostBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-text-primary/10 rounded animate-pulse motion-reduce:animate-none ${className}`}
    />
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const tone =
    status === 'offer' || status === 'interviewing'
      ? 'bg-success/25 text-text-on-success'
      : 'bg-bg-main text-text-secondary';
  return (
    <span className={`font-body text-xs font-medium px-2 py-1 rounded-full shrink-0 ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
        <ApplicationsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
