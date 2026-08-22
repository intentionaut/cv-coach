'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { EVENTS, track } from '@/lib/analytics/events';

interface PracticeSession {
  id: string;
  title: string;
  started_at: string;
  completed_at: string | null;
  total_time_minutes: number;
  overall_confidence: number | null;
  overall_clarity: number | null;
  question_count: number;
  cv_name: string | null;
  cv_job_title: string | null;
}

interface CvOption {
  id: string;
  name: string;
  jobTitle: string;
}

interface CategoryStat {
  category: string;
  answered: number;
  avgClarity: number;
}

interface Strengths {
  categories: CategoryStat[];
  strongest: CategoryStat | null;
  weakest: CategoryStat | null;
  totalAnswered: number;
}

function CoachingContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvs, setCvs] = useState<CvOption[]>([]);
  // '' means general practice, not tied to any particular role.
  const [selectedCvId, setSelectedCvId] = useState('');
  const [strengths, setStrengths] = useState<Strengths | null>(null);

  useEffect(() => {
    fetchSessions();
    fetchCvs();
    fetchStrengths();
  }, []);

  // Patterns across sessions, not per-answer feedback - the thing you can
  // only see once you've practised a few times.
  const fetchStrengths = async () => {
    try {
      const response = await fetch('/api/interview/strengths');
      if (!response.ok) return;
      setStrengths(await response.json());
    } catch (error) {
      console.error('Failed to fetch strengths:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/interview/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // CVs carry the job title/description, so they're what makes a practice
  // session role-specific. Defaults to the first CV that names a role.
  const fetchCvs = async () => {
    try {
      const response = await fetch('/api/cv');
      if (!response.ok) return;
      const data = await response.json();
      const list: CvOption[] = (data.cvs || []).map((cv: any) => ({
        id: cv.id,
        name: cv.name,
        jobTitle: cv.jobTitle || ''
      }));
      setCvs(list);
      const firstWithRole = list.find(cv => cv.jobTitle.trim());
      if (firstWithRole) setSelectedCvId(firstWithRole.id);
    } catch (error) {
      console.error('Failed to fetch CVs:', error);
    }
  };

  const startNewSession = async (practiceType: 'written' | 'voice') => {
    const mode = practiceType === 'voice' ? 'Voice' : 'Written';
    const chosen = cvs.find(cv => cv.id === selectedCvId);
    const roleLabel = chosen?.jobTitle?.trim() || chosen?.name;
    try {
      const response = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roleLabel
            ? `${roleLabel} (${mode})`
            : `General Film Industry Practice (${mode})`,
          session_type: selectedCvId ? 'role-specific' : 'general',
          cv_id: selectedCvId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        track(EVENTS.PRACTICE_STARTED, {
          mode: practiceType,
          isRoleSpecific: !!selectedCvId,
          priorSessions: sessions.length
        });
        if (practiceType === 'voice') {
          router.push(`/coaching/voice/${data.sessionId}`);
        } else {
          router.push(`/coaching/practice/${data.sessionId}`);
        }
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="font-display text-2xl font-bold text-text-primary">Interview Practice</h1>
          <p className="font-body text-sm text-text-secondary">Build confidence with written interview practice</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start New Session Card */}
        <div className="bg-accent-tertiary rounded-lg p-8 text-text-on-tertiary mb-8">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold mb-3">Ready to Practice?</h2>
            <p className="font-body text-text-inverse/75 mb-6">
              Choose how you'd like to practice: answer questions in writing or simulate a real phone interview.
            </p>

            {/* Ties the session to a role, so questions and feedback can be
                specific to the job rather than generic film-industry ones. */}
            {cvs.length > 0 && (
              <div className="mb-6">
                <label
                  htmlFor="practice-role"
                  className="font-body block text-sm font-semibold text-text-on-tertiary mb-2"
                >
                  What are you preparing for?
                </label>
                <select
                  id="practice-role"
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="font-body w-full max-w-md px-3 py-2 rounded-lg bg-bg-surface text-text-primary text-sm border border-border-hairline focus:outline-none focus:ring-2 focus:ring-accent-secondary"
                >
                  {cvs.map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.jobTitle.trim() ? `${cv.jobTitle} — using ${cv.name}` : cv.name}
                    </option>
                  ))}
                  <option value="">General film industry practice</option>
                </select>
                <p className="font-body text-xs text-text-inverse/75 mt-2">
                  Practising against one of your CVs lets the feedback connect your answers to that specific role.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {/* Secondary-style: dark surface, light fill, meets contrast at any size (accent-tertiary text on light bg) */}
              <button
                onClick={() => startNewSession('written')}
                className="font-body flex-1 min-w-[200px] px-8 py-4 bg-bg-surface text-accent-tertiary rounded-lg text-lg font-semibold hover:bg-bg-main transition shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Written Practice</span>
                </div>
              </button>
              {/* Primary CTA: text-on-cta is white — deliberately not WCAG-audited, see globals.css */}
              <button
                onClick={() => startNewSession('voice')}
                className="font-body flex-1 min-w-[200px] px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg text-lg font-bold hover:opacity-90 transition shadow-lg border-2 border-cta-primary"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span>Phone Interview →</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Patterns across sessions. Only appears once there's enough
            practice for a pattern to be real rather than noise. */}
        {strengths?.strongest && strengths?.weakest && (
          <div className="bg-bg-surface rounded-lg shadow border border-border-hairline p-6 mb-8">
            <h3 className="font-display text-lg font-bold text-text-primary mb-1">
              What&apos;s emerging across your practice
            </h3>
            <p className="font-body text-xs text-text-secondary mb-4">
              Based on {strengths.totalAnswered} answers so far
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-success/15 border border-success/30 rounded-lg p-4">
                <p className="font-body text-xs uppercase tracking-wide text-text-on-success mb-1">
                  Strongest so far
                </p>
                <p className="font-display font-bold text-text-primary capitalize">
                  {strengths.strongest.category.replace(/-/g, ' ')}
                </p>
                <p className="font-body text-xs text-text-secondary mt-0.5">
                  averaging {strengths.strongest.avgClarity}/5 over {strengths.strongest.answered} answers
                </p>
              </div>
              <div className="bg-alert/25 border border-alert rounded-lg p-4">
                <p className="font-body text-xs uppercase tracking-wide text-text-on-alert mb-1">
                  Worth more practice
                </p>
                <p className="font-display font-bold text-text-primary capitalize">
                  {strengths.weakest.category.replace(/-/g, ' ')}
                </p>
                <p className="font-body text-xs text-text-secondary mt-0.5">
                  averaging {strengths.weakest.avgClarity}/5 over {strengths.weakest.answered} answers
                </p>
              </div>
            </div>
            <p className="font-body text-xs text-text-secondary">
              A weaker category usually means less practice, not less ability — these are the questions worth
              sitting with.
            </p>
          </div>
        )}

        {/* Past Sessions */}
        <div className="bg-bg-surface rounded-lg shadow">
          <div className="px-6 py-4 border-b border-border-hairline">
            <h3 className="font-display text-lg font-bold text-text-primary">Your Practice History</h3>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-bg-main rounded"></div>
                <div className="h-20 bg-bg-main rounded"></div>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="font-display text-xl font-bold text-text-primary mb-2">No practice sessions yet</h3>
              <p className="font-body text-text-secondary">
                Start your first practice session to begin building your interview confidence!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-hairline">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/coaching/review/${session.id}`)}
                  className="w-full px-6 py-4 hover:bg-bg-main transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-text-primary mb-1">{session.title}</h4>
                      <p className="font-body text-sm text-text-secondary">
                        {session.cv_name && (
                          <span className="text-accent-tertiary font-medium">
                            {session.cv_job_title?.trim() || session.cv_name} •{' '}
                          </span>
                        )}
                        {new Date(session.started_at).toLocaleDateString()} • {session.question_count} questions
                        {session.total_time_minutes > 0 && ` • ${session.total_time_minutes} min`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {session.overall_confidence && (
                        <div className="text-center">
                          <div className="font-body text-sm text-text-secondary mb-1">Confidence</div>
                          <div className="font-display text-lg font-bold text-accent-tertiary">
                            {session.overall_confidence}/5
                          </div>
                        </div>
                      )}
                      {session.overall_clarity && (
                        <div className="text-center">
                          <div className="font-body text-sm text-text-secondary mb-1">Clarity</div>
                          <div className="font-display text-lg font-bold text-text-cta">
                            {session.overall_clarity}/5
                          </div>
                        </div>
                      )}
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CoachingPage() {
  return (
    <ProtectedRoute>
      <CoachingContent />
    </ProtectedRoute>
  );
}
