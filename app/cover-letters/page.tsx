'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EditIcon } from '@/components/ui/icons';
import { formatRelativeTime } from '@/lib/format';
import { EVENTS, track } from '@/lib/analytics/events';
import { useRouter, useSearchParams } from 'next/navigation';
import { REUSABLE_QUESTIONS } from '@/lib/data/cover-letter-questions';
import BackToDashboard from '@/components/ui/BackToDashboard';

type ApplicationStatus = 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected';

interface LetterListItem {
  id: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  cvName: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected'
};

interface CvOption {
  id: string;
  name: string;
}

interface Feedback {
  strengths: string[];
  questions: string[];
}

function CoverLettersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [letters, setLetters] = useState<LetterListItem[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(true);
  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // New-letter setup flow
  const [newCvId, setNewCvId] = useState('');
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  const [needsAnswers, setNeedsAnswers] = useState<string[]>([]);
  const [editingAnswerKey, setEditingAnswerKey] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Shared per-letter fields (used both while setting up a new letter and
  // while viewing/editing an existing one)
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [content, setContent] = useState('');
  const [letterStatus, setLetterStatus] = useState<ApplicationStatus>('draft');
  const [letterAppliedAt, setLetterAppliedAt] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const fieldsSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLetterList = async (): Promise<LetterListItem[]> => {
    const response = await fetch('/api/cover-letters');
    if (!response.ok) return [];
    const data = await response.json();
    setLetters(data.letters || []);
    return data.letters || [];
  };

  const loadCvOptions = async () => {
    const response = await fetch('/api/cv');
    if (!response.ok) return;
    const data = await response.json();
    setCvs((data.cvs || []).map((cv: any) => ({ id: cv.id, name: cv.name })));
  };

  const resetEditor = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setContent('');
    setFeedback(null);
    setLetterStatus('draft');
    setLetterAppliedAt(null);
  };

  const startNewLetter = async (presetCvId?: string) => {
    setSelectedLetterId(null);
    setCreatingNew(true);
    resetEditor();
    setAnswerDrafts({});
    setEditingAnswerKey(null);
    setGenerateError(null);
    if (presetCvId) {
      setNewCvId(presetCvId);
    } else if (cvs.length > 0 && !newCvId) {
      setNewCvId(cvs[0].id);
    }
  };

  const loadSetupForCv = async (cvId: string) => {
    if (!cvId) return;
    setLoadingSetup(true);
    try {
      const response = await fetch(`/api/cover-letters/new?cvId=${cvId}`);
      if (!response.ok) return;
      const data = await response.json();
      setExistingAnswers(data.answers || {});
      setNeedsAnswers(data.needsAnswers || []);
      setJobTitle(data.cv.jobTitle || '');
      setJobDescription(data.cv.jobDescription || '');
    } catch (error) {
      console.error('Failed to load cover letter setup:', error);
    } finally {
      setLoadingSetup(false);
    }
  };

  const selectLetter = async (id: string) => {
    setCreatingNew(false);
    setSelectedLetterId(id);
    resetEditor();
    try {
      const response = await fetch(`/api/cover-letters/${id}`);
      if (!response.ok) return;
      const data = await response.json();
      setCompanyName(data.companyName || '');
      setJobTitle(data.jobTitle || '');
      setJobDescription(data.jobDescription || '');
      setContent(data.content || '');
      setLetterStatus(data.status || 'draft');
      setLetterAppliedAt(data.appliedAt || null);
    } catch (error) {
      console.error('Failed to load cover letter:', error);
    }
  };

  useEffect(() => {
    (async () => {
      await loadCvOptions();
      const list = await loadLetterList();
      // Arriving from the CV page with a specific CV in mind ("Write a
      // Cover Letter for this CV") should always land in the new-letter
      // flow for that CV, not on whatever letter was most recently touched.
      const cvIdParam = searchParams.get('cvId');
      if (cvIdParam) {
        await startNewLetter(cvIdParam);
      } else if (list.length > 0) {
        await selectLetter(list[0].id);
      } else {
        await startNewLetter();
      }
      setLoadingLetters(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (creatingNew && newCvId) {
      loadSetupForCv(newCvId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatingNew, newCvId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cover letter? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' });
      if (!response.ok) return;
      const list = await loadLetterList();
      if (list.length > 0) {
        await selectLetter(list[0].id);
      } else {
        await startNewLetter();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Debounced saves for an existing letter's fields/content - mirrors the
  // CV page's pattern (edit is free, only generating/reviewing costs a call).
  const saveField = (field: 'companyName' | 'jobTitle' | 'jobDescription', value: string) => {
    if (!selectedLetterId) return;
    if (fieldsSaveTimeout.current) clearTimeout(fieldsSaveTimeout.current);
    fieldsSaveTimeout.current = setTimeout(() => {
      fetch(`/api/cover-letters/${selectedLetterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      }).catch(err => console.error('Failed to save field:', err));
    }, 800);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (!selectedLetterId) return;
    if (contentSaveTimeout.current) clearTimeout(contentSaveTimeout.current);
    contentSaveTimeout.current = setTimeout(() => {
      fetch(`/api/cover-letters/${selectedLetterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value })
      }).catch(err => console.error('Failed to save content:', err));
    }, 800);
  };

  const handleGenerate = async () => {
    if (!newCvId) {
      setGenerateError('Choose which CV this letter is for.');
      return;
    }
    if (!jobTitle.trim()) {
      setGenerateError('What role are you applying for?');
      return;
    }
    setGenerateError(null);
    setGenerating(true);
    try {
      const response = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvId: newCvId,
          companyName: companyName || undefined,
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription || undefined,
          answers: answerDrafts
        })
      });
      const result = await response.json();
      if (result.success) {
        track(EVENTS.COVER_LETTER_GENERATED, {
          hasCompanyName: !!companyName.trim(),
          hasJobDescription: !!jobDescription.trim(),
          // How much of the reusable answer bank existed beforehand - the
          // whole premise is that later letters need fewer questions.
          reusableAnswersOnHand: Object.keys(existingAnswers).length,
          newAnswersGiven: Object.values(answerDrafts).filter(v => v?.trim()).length
        });
        setContent(result.content);
        setCreatingNew(false);
        await loadLetterList();
        setSelectedLetterId(result.letterId);
      } else {
        setGenerateError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenerateError('Something went wrong. Please check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async () => {
    if (!selectedLetterId || !content.trim()) return;
    setReviewing(true);
    try {
      const response = await fetch(`/api/cover-letters/${selectedLetterId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const result = await response.json();
      if (result.success) {
        track(EVENTS.COVER_LETTER_REVIEWED, {
          strengths: result.feedback?.strengths?.length ?? 0,
          questions: result.feedback?.questions?.length ?? 0
        });
        setFeedback(result.feedback);
      } else {
        alert(`Feedback failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('Failed to get feedback');
    } finally {
      setReviewing(false);
    }
  };

  // Captures that the user actually applied, and lets status be updated on
  // revisit ("any updates since you applied?") - applied_at is stamped
  // server-side the first time only, so it stays put across later updates.
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!selectedLetterId) return;
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/cover-letters/${selectedLetterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        // "Applied" is the moment the product's actual purpose is served, so
        // it gets its own event rather than being buried in a status change.
        if (newStatus === 'applied' && letterStatus === 'draft') {
          track(EVENTS.APPLICATION_SENT, { hadReview: !!feedback });
        } else {
          track(EVENTS.APPLICATION_OUTCOME_UPDATED, {
            from: letterStatus,
            to: newStatus,
            isPositive: newStatus === 'interviewing' || newStatus === 'offer'
          });
        }
        setLetterStatus(newStatus);
        if (newStatus === 'applied' && !letterAppliedAt) {
          setLetterAppliedAt(new Date().toISOString());
        }
        setLetters(prev => prev.map(l => (l.id === selectedLetterId ? { ...l, status: newStatus } : l)));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const pencilIcon = (
    <EditIcon className="w-3.5 h-3.5" />
  );

  if (loadingLetters) {
    return <div className="min-h-screen bg-bg-main" />;
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">Cover Letters</h1>
          <p className="font-body text-text-secondary">
            Answer a few questions once, then reuse them every time you write to a new role.
          </p>
          <BackToDashboard className="font-body text-text-link hover:text-text-cta font-medium mt-4 inline-block" />
        </div>

        {cvs.length === 0 ? (
          <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-8 text-center">
            <p className="font-body text-text-secondary mb-4">
              You&apos;ll need a CV before you can write a cover letter.
            </p>
            <button
              onClick={() => router.push('/cv')}
              className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition"
            >
              Build a CV first
            </button>
          </div>
        ) : (
          <>
            {/* My Cover Letters */}
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-text-primary mb-3">My Cover Letters</h2>
              <div className="flex items-stretch gap-3 flex-wrap">
                {letters.map((letter, index) => {
                  const isActive = !creatingNew && letter.id === selectedLetterId;
                  return (
                    <div
                      key={letter.id}
                      onClick={() => selectLetter(letter.id)}
                      className={`font-body min-w-[200px] px-4 py-3 rounded-lg border-2 cursor-pointer transition ${
                        isActive
                          ? 'border-accent-tertiary bg-accent-secondary/15'
                          : 'border-border-hairline bg-bg-surface hover:border-accent-tertiary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-body text-xs font-bold text-accent-tertiary mt-0.5">{index + 1}.</span>
                          <div>
                            <p className="font-semibold text-sm text-text-primary">
                              {letter.companyName ? `${letter.companyName} — ${letter.jobTitle}` : letter.jobTitle}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {letter.status !== 'draft' ? `${STATUS_LABELS[letter.status]} · ` : ''}
                              {letter.cvName} · {formatRelativeTime(letter.updatedAt)}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(letter.id); }}
                            className="text-text-secondary hover:text-text-cta text-sm p-0.5"
                            aria-label="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => startNewLetter()}
                  className={`font-body min-w-[140px] px-4 py-3 rounded-lg border-2 border-dashed text-sm font-semibold transition ${
                    creatingNew
                      ? 'border-accent-tertiary text-accent-tertiary'
                      : 'border-border-hairline text-text-secondary hover:text-text-primary'
                  }`}
                >
                  + New Cover Letter
                </button>
              </div>
            </div>

            {creatingNew ? (
              <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline overflow-hidden">
                {/* Brief explainer - static copy, not generated */}
                <div className="p-6 bg-accent-secondary/15 border-b border-border-hairline">
                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">What a cover letter needs to do</h3>
                  <ul className="font-body text-sm text-text-secondary space-y-1 list-disc list-inside">
                    <li>Open with a genuine reason you&apos;re writing - not &quot;I am writing to apply for...&quot;</li>
                    <li>Connect a real piece of your experience to what this specific role needs</li>
                    <li>Show you actually looked into this company or production, not just the industry</li>
                    <li>Close with confidence, briefly</li>
                  </ul>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-text-primary block mb-1">Which CV is this for?</label>
                    <select
                      value={newCvId}
                      onChange={(e) => setNewCvId(e.target.value)}
                      className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                    >
                      {cvs.map(cv => (
                        <option key={cv.id} value={cv.id}>{cv.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm font-semibold text-text-primary block mb-1">Company</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Who are you applying to?"
                        className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm font-semibold text-text-primary block mb-1">Role</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Job title"
                        className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-sm font-semibold text-text-primary block mb-1">Job description (optional)</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the posting here if you have it..."
                      rows={3}
                      className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none text-sm bg-bg-main text-text-primary"
                    />
                  </div>

                  {!loadingSetup && (
                    <div className="pt-2 border-t border-border-hairline space-y-4">
                      {REUSABLE_QUESTIONS.map(q => {
                        const isDeclared = existingAnswers[q.key] && editingAnswerKey !== q.key;
                        return (
                          <div key={q.key}>
                            {isDeclared ? (
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <p className="font-body text-sm text-text-secondary">{q.prompt}</p>
                                  <p className="font-body text-sm font-bold text-text-primary mt-0.5">{existingAnswers[q.key]}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingAnswerKey(q.key);
                                    setAnswerDrafts(prev => ({ ...prev, [q.key]: existingAnswers[q.key] }));
                                  }}
                                  className="text-text-secondary hover:text-text-primary p-0.5 shrink-0"
                                  aria-label={`Edit ${q.key}`}
                                  title="Edit"
                                >
                                  {pencilIcon}
                                </button>
                              </div>
                            ) : (
                              <div>
                                <label className="font-body text-sm font-semibold text-text-primary block mb-0.5">{q.prompt}</label>
                                <p className="font-body text-xs text-text-secondary mb-1">{q.helper}</p>
                                <textarea
                                  autoFocus={editingAnswerKey === q.key}
                                  value={answerDrafts[q.key] || ''}
                                  onChange={(e) => setAnswerDrafts(prev => ({ ...prev, [q.key]: e.target.value }))}
                                  onBlur={() => {
                                    if (answerDrafts[q.key]?.trim()) setEditingAnswerKey(null);
                                  }}
                                  rows={2}
                                  className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none text-sm bg-bg-main text-text-primary"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {generateError && (
                    <div className="flex items-start gap-2 bg-cta-primary/10 border border-cta-primary/30 rounded-lg p-3">
                      <span className="text-text-cta text-sm mt-0.5" aria-hidden="true">⚠</span>
                      <p className="font-body text-sm text-text-cta">{generateError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={generating || loadingSetup}
                    className="font-body w-full px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {generating ? 'Writing your draft...' : 'Generate Draft'}
                  </button>
                </div>
              </div>
            ) : selectedLetterId ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline overflow-hidden">
                    <div className="p-4 border-b border-border-hairline grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => { setCompanyName(e.target.value); saveField('companyName', e.target.value); }}
                        placeholder="Company"
                        className="font-body px-3 py-1.5 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => { setJobTitle(e.target.value); saveField('jobTitle', e.target.value); }}
                        placeholder="Job title"
                        className="font-body px-3 py-1.5 border border-border-hairline rounded-lg bg-bg-main text-text-primary text-sm focus:ring-2 focus:ring-accent-tertiary focus:border-transparent"
                      />
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full h-[500px] p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-bg-surface text-text-primary"
                      placeholder="Your draft will appear here..."
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={handleReview}
                      disabled={reviewing || !content.trim()}
                      className="font-body px-6 py-3 bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition disabled:opacity-50"
                    >
                      {reviewing ? 'Reviewing...' : 'Get Feedback'}
                    </button>
                  </div>

                  {/* Stage 4 of the flow: capture that they actually applied,
                      then let them log what happened if they revisit later -
                      applied_at only gets stamped the first time. */}
                  <div className="mt-4 bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6">
                    {letterStatus === 'draft' ? (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="font-body text-sm text-text-secondary">Sent this one off yet?</p>
                        <button
                          onClick={() => handleStatusChange('applied')}
                          disabled={updatingStatus || !content.trim()}
                          className="font-body px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                        >
                          I Applied
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                          <p className="font-body text-sm text-text-primary font-semibold">
                            {STATUS_LABELS[letterStatus]}
                            {letterAppliedAt && (
                              <span className="font-normal text-text-secondary"> · applied {formatRelativeTime(letterAppliedAt)}</span>
                            )}
                          </p>
                        </div>
                        <p className="font-body text-xs text-text-secondary mb-2">Any updates?</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(['interviewing', 'offer', 'rejected'] as ApplicationStatus[])
                            .filter(s => s !== letterStatus)
                            .map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                disabled={updatingStatus}
                                className="font-body px-3 py-1.5 text-xs font-semibold border border-border-hairline rounded-lg text-text-secondary hover:border-accent-tertiary hover:text-accent-tertiary transition disabled:opacity-50"
                              >
                                {STATUS_LABELS[s]}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {feedback ? (
                    <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6 space-y-6">
                      {feedback.strengths.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-text-primary mb-2">What&apos;s Already Working</h3>
                          <ul className="space-y-2">
                            {feedback.strengths.map((s, idx) => (
                              <li key={idx} className="font-body text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-success shrink-0">✓</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedback.questions.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-text-primary mb-2">Worth Thinking About</h3>
                          <ul className="space-y-2">
                            {feedback.questions.map((q, idx) => (
                              <li key={idx} className="font-body text-sm text-text-secondary">{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline p-6">
                      <p className="font-body text-sm text-text-secondary">
                        Edit your draft as needed, then click &quot;Get Feedback&quot; for guiding questions on what to sharpen - not a rewrite.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function CoverLettersPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
        <CoverLettersContent />
      </Suspense>
    </ProtectedRoute>
  );
}
