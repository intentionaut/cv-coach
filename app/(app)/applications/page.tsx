'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { formatRelativeTime } from '@/lib/format';
import { EVENTS, track } from '@/lib/analytics/events';
import {
  STATUS_LABELS,
  OUTCOME_STATUSES,
  type ApplicationStatus
} from '@/lib/applications';

/**
 * Applications, as a first-class thing rather than a property of a cover
 * letter.
 *
 * The old model made a letter the record of a job, which meant a job you got
 * by emailing your CV to a coordinator - a lot of early-career crew work -
 * simply didn't exist in the product. So the primary action here is "log an
 * application", with the documents attached to it optional.
 *
 * The counts at the top are the point of the page: effort in, outcomes out.
 * No response is deliberately shown separately from rejected.
 */

interface ApplicationListItem {
  id: string;
  companyName: string;
  jobTitle: string;
  source: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  notes: string;
  cvId: string | null;
  cvName: string | null;
  letterCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationDetail extends Omit<ApplicationListItem, 'letterCount'> {
  jobDescription: string;
  letters: Array<{ id: string; hasContent: boolean; updatedAt: string }>;
}

interface CvOption {
  id: string;
  name: string;
}

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loggingNew, setLoggingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New-application form
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newCvId, setNewCvId] = useState('');
  const [newAlreadySent, setNewAlreadySent] = useState(true);

  const fieldSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const [list] = await Promise.all([
        loadList(),
        fetch('/api/cv')
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data) setCvs((data.cvs || []).map((cv: any) => ({ id: cv.id, name: cv.name })));
          })
          .catch(() => {})
      ]);
      const idParam = searchParams.get('id');
      if (idParam) {
        await loadDetail(idParam);
      } else if (list.length > 0) {
        await loadDetail(list[0].id);
      } else {
        setLoggingNew(true);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLogging = () => {
    setLoggingNew(true);
    setSelectedId(null);
    setDetail(null);
    setFormError(null);
    setNewJobTitle('');
    setNewCompany('');
    setNewSource('');
    setNewCvId('');
    setNewAlreadySent(true);
  };

  const handleCreate = async () => {
    if (!newJobTitle.trim()) {
      setFormError('What role was it? Even a rough title is enough to track it.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: newJobTitle.trim(),
          companyName: newCompany.trim() || undefined,
          source: newSource.trim() || undefined,
          cvId: newCvId || undefined,
          status: newAlreadySent ? 'applied' : 'draft'
        })
      });
      const result = await response.json();
      if (!result.success) {
        setFormError(result.error || 'Something went wrong. Please try again.');
        return;
      }
      if (newAlreadySent) {
        track(EVENTS.APPLICATION_SENT, {
          loggedManually: true,
          hasCv: !!newCvId,
          hasCoverLetter: false,
          hasSource: !!newSource.trim()
        });
      }
      setLoggingNew(false);
      await loadList();
      await loadDetail(result.applicationId);
    } catch (error) {
      console.error('Create application error:', error);
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    if (!selectedId) return false;
    const response = await fetch(`/api/applications/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.ok;
  };

  // Notes and source save on a debounce - the same pattern as the CV and
  // letter editors, where typing is free and only AI calls cost anything.
  const saveFieldDebounced = (field: string, value: string) => {
    if (fieldSaveTimeout.current) clearTimeout(fieldSaveTimeout.current);
    fieldSaveTimeout.current = setTimeout(() => {
      patch({ [field]: value }).catch(err => console.error('Failed to save field:', err));
    }, 800);
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!detail) return;
    const previous = detail.status;
    setSaving(true);
    try {
      const ok = await patch({ status: newStatus });
      if (!ok) return;
      if (newStatus === 'applied' && previous === 'draft') {
        track(EVENTS.APPLICATION_SENT, {
          loggedManually: false,
          hasCv: !!detail.cvId,
          hasCoverLetter: detail.letters.length > 0,
          hasSource: !!detail.source
        });
      } else {
        track(EVENTS.APPLICATION_OUTCOME_UPDATED, {
          from: previous,
          to: newStatus,
          isPositive: newStatus === 'interviewing' || newStatus === 'offer'
        });
      }
      setDetail({
        ...detail,
        status: newStatus,
        appliedAt: detail.appliedAt || (newStatus !== 'draft' ? new Date().toISOString() : null)
      });
      setApplications(prev =>
        prev.map(a => (a.id === selectedId ? { ...a, status: newStatus } : a))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Delete this application? Any cover letter written for it goes too. This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!response.ok) return;
      const list = await loadList();
      if (list.length > 0) {
        await loadDetail(list[0].id);
      } else {
        startLogging();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const sent = applications.filter(a => a.status !== 'draft');
  const interviewed = applications.filter(a => a.status === 'interviewing' || a.status === 'offer');
  const offers = applications.filter(a => a.status === 'offer');
  const silent = applications.filter(a => a.status === 'no_response');

  if (loading) {
    return <div className="min-h-screen bg-bg-main" />;
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Applications</h1>
            <p className="font-body text-text-secondary">
              Every role you&apos;ve gone for, including the ones you sent before you got here.
            </p>
          </div>
          <button
            onClick={startLogging}
            className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition shrink-0"
          >
            Log an application
          </button>
        </div>

        {sent.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-bg-surface rounded-lg border border-border-hairline p-6">
            <Stat label="Sent" value={sent.length} />
            <Stat label="Got to interview" value={interviewed.length} />
            <Stat label="Offers" value={offers.length} />
            <Stat label="No reply" value={silent.length} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-2">
            {applications.length === 0 && !loggingNew && (
              <p className="font-body text-sm text-text-secondary">
                Nothing tracked yet.
              </p>
            )}
            {applications.map(app => {
              const isActive = app.id === selectedId;
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    setLoggingNew(false);
                    loadDetail(app.id);
                  }}
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
                  <p className="text-xs text-text-secondary mt-1.5">
                    {[
                      app.cvName ? `CV: ${app.cvName}` : null,
                      app.letterCount > 0
                        ? `${app.letterCount} cover letter${app.letterCount === 1 ? '' : 's'}`
                        : null,
                      app.appliedAt
                        ? `applied ${formatRelativeTime(app.appliedAt)}`
                        : `started ${formatRelativeTime(app.createdAt)}`
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail or new-application form */}
          <div className="lg:col-span-3">
            {loggingNew ? (
              <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-text-primary mb-1">
                    Log an application
                  </h2>
                  <p className="font-body text-sm text-text-secondary">
                    Applied somewhere already, by email or through a listing site? Add it here so
                    your record is the whole picture, not just what you wrote in Friday.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Role" required>
                    <input
                      type="text"
                      value={newJobTitle}
                      onChange={e => setNewJobTitle(e.target.value)}
                      placeholder="Job title"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Company or production">
                    <input
                      type="text"
                      value={newCompany}
                      onChange={e => setNewCompany(e.target.value)}
                      placeholder="Who was it for?"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field
                  label="How did you find it?"
                  helper="ScreenSkills, Mandy, a direct email, someone you know — worth knowing which routes actually get replies."
                >
                  <input
                    type="text"
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    placeholder="Where it came from"
                    className={inputClass}
                  />
                </Field>

                {cvs.length > 0 && (
                  <Field label="Which CV did you send?" helper="Optional.">
                    <select
                      value={newCvId}
                      onChange={e => setNewCvId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Not sure / not one of these</option>
                      {cvs.map(cv => (
                        <option key={cv.id} value={cv.id}>
                          {cv.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <label className="font-body flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={newAlreadySent}
                    onChange={e => setNewAlreadySent(e.target.checked)}
                    className="w-4 h-4 accent-accent-tertiary"
                  />
                  I&apos;ve already sent this one
                </label>

                {formError && (
                  <div className="flex items-start gap-2 bg-cta-primary/10 border border-cta-primary/30 rounded-lg p-3">
                    <span className="text-text-cta text-sm mt-0.5" aria-hidden="true">
                      ⚠
                    </span>
                    <p className="font-body text-sm text-text-cta">{formError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add it'}
                  </button>
                  {applications.length > 0 && (
                    <button
                      onClick={() => {
                        setLoggingNew(false);
                        if (applications[0]) loadDetail(applications[0].id);
                      }}
                      className="font-body px-6 py-3 bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : detail ? (
              <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold text-text-primary break-words">
                      {detail.jobTitle}
                    </h2>
                    {detail.companyName && (
                      <p className="font-body text-text-secondary mt-0.5">{detail.companyName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(detail.id)}
                    className="font-body text-sm text-text-secondary hover:text-text-cta shrink-0"
                  >
                    Delete
                  </button>
                </div>

                {/* Where it stands. Draft gets one clear action; anything sent
                    gets the outcomes, because that's the question you come
                    back to answer. */}
                <div className="border-t border-border-hairline pt-5">
                  {detail.status === 'draft' ? (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="font-body text-sm text-text-secondary">Sent this one off yet?</p>
                      <button
                        onClick={() => handleStatusChange('applied')}
                        disabled={saving}
                        className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                      >
                        I applied
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-body text-sm font-semibold text-text-primary mb-3">
                        {STATUS_LABELS[detail.status]}
                        {detail.appliedAt && (
                          <span className="font-normal text-text-secondary">
                            {' '}
                            · applied {formatRelativeTime(detail.appliedAt)}
                          </span>
                        )}
                      </p>
                      <p className="font-body text-xs text-text-secondary mb-2">Any updates?</p>
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
                  )}
                </div>

                {/* What you put into it. Named plainly so the gap is visible:
                    an application with no CV and no letter attached is a
                    different kind of effort from one with both. */}
                <div className="border-t border-border-hairline pt-5">
                  <h3 className="font-display font-bold text-text-primary mb-3">What you sent</h3>
                  <ul className="space-y-2">
                    <li className="font-body text-sm text-text-secondary flex items-center justify-between gap-3">
                      <span>{detail.cvName ? `CV — ${detail.cvName}` : 'No CV attached'}</span>
                      <button
                        onClick={() => router.push('/cv')}
                        className="text-text-link hover:underline shrink-0"
                      >
                        {detail.cvName ? 'Open' : 'Add one'}
                      </button>
                    </li>
                    <li className="font-body text-sm text-text-secondary flex items-center justify-between gap-3">
                      <span>
                        {detail.letters.length > 0
                          ? `${detail.letters.length} cover letter${detail.letters.length === 1 ? '' : 's'}`
                          : 'No cover letter'}
                      </span>
                      <button
                        onClick={() =>
                          router.push(
                            detail.letters.length > 0
                              ? `/cover-letters?letterId=${detail.letters[0].id}`
                              : `/cover-letters?applicationId=${detail.id}`
                          )
                        }
                        className="text-text-link hover:underline shrink-0"
                      >
                        {detail.letters.length > 0 ? 'Open' : 'Write one'}
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-border-hairline pt-5 space-y-4">
                  <Field
                    label="How you found it"
                    helper="Worth knowing which routes actually get replies."
                  >
                    <input
                      type="text"
                      defaultValue={detail.source}
                      onChange={e => saveFieldDebounced('source', e.target.value)}
                      placeholder="ScreenSkills, Mandy, direct email, a contact..."
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Notes"
                    helper="Who you spoke to, what they said, when to follow up."
                  >
                    <textarea
                      defaultValue={detail.notes}
                      onChange={e => saveFieldDebounced('notes', e.target.value)}
                      rows={3}
                      placeholder="Anything you'll want to remember next time this comes up..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent';

function Field({
  label,
  helper,
  required,
  children
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-body text-sm font-semibold text-text-primary block mb-0.5">
        {label}
        {required && <span className="text-text-cta"> *</span>}
      </label>
      {helper && <p className="font-body text-xs text-text-secondary mb-1">{helper}</p>}
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-text-primary tabular-nums">{value}</div>
      <p className="font-body text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  if (status === 'draft') return null;
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
