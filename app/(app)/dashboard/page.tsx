'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { setUserProgress } from '@/lib/mixpanel';

interface DashboardStatus {
  cvCount: number;
  cvAnalysedCount: number;
  interviewSessionCount: number;
  latestInterviewAt: string | null;
  gettingStartedDismissed: boolean;
  coverLetterCount: number;
  appliedCount: number;
  interviewingCount: number;
  offerCount: number;
}

function DashboardContent() {
  const router = useRouter();
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setStatus(data);
        // The dashboard already fetches the full rollup, so this is the
        // natural place to keep user-level properties current.
        setUserProgress({
          cvCount: data.cvCount,
          cvAnalysedCount: data.cvAnalysedCount,
          coverLetterCount: data.coverLetterCount,
          appliedCount: data.appliedCount,
          interviewingCount: data.interviewingCount,
          offerCount: data.offerCount,
          interviewSessionCount: data.interviewSessionCount
        });
      })
      .catch((err) => console.error('Failed to load dashboard status:', err));
  }, []);

  const handleDismissGettingStarted = () => {
    setDismissing(true);
    setStatus((prev) => (prev ? { ...prev, gettingStartedDismissed: true } : prev));
    fetch('/api/dashboard/dismiss-getting-started', { method: 'POST' }).catch((err) => {
      console.error('Failed to dismiss getting-started:', err);
    });
  };

  const hasCv = (status?.cvCount ?? 0) > 0;
  const hasAnalysedCv = (status?.cvAnalysedCount ?? 0) > 0;
  const hasInterviewed = (status?.interviewSessionCount ?? 0) > 0;
  const hasCoverLetter = (status?.coverLetterCount ?? 0) > 0;
  const hasApplied = (status?.appliedCount ?? 0) > 0;

  // Every step here must be reachable in the product as it actually exists -
  // this previously included a skills assessment that was never buildable,
  // so the checklist could never complete and never self-dismissed.
  const allStepsDone = status !== null && hasCv && hasCoverLetter && hasInterviewed;
  const showGettingStarted = status !== null && !status.gettingStartedDismissed && !allStepsDone;

  // Reflects real progress rather than sitting on one static line forever -
  // leads with applications sent, since that's the outcome that actually
  // matters, and falls back through the earlier stages of the journey.
  const heroSubtitle = (() => {
    if (status === null) {
      return 'AI-powered coaching to help you land your first gig in the film industry';
    }
    if (hasApplied) {
      const n = status.appliedCount;
      return `${n} application${n === 1 ? '' : 's'} sent — keep the momentum going`;
    }
    if (allStepsDone) {
      return "You've worked through every stage — time to start applying";
    }
    if (hasAnalysedCv) {
      return 'Your CV has feedback waiting — next, write a cover letter for a role you want';
    }
    if (hasCv) {
      return "Your CV is uploaded — get feedback on it when you're ready";
    }
    return 'AI-powered coaching to help you land your first gig in the film industry';
  })();

  return (
    <div className="min-h-screen bg-bg-main">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* One progress surface, not four. The old blue banner carried a
            generic heading and one useful sentence, while the real numbers
            sat in a separate card below it - so this merges them.

            Only appears once something has actually happened. A scoreboard of
            zeroes on day one is worse than no scoreboard: the Getting Started
            checklist is the right first thing to see. */}
        {status !== null && hasCv && (
          <div className="bg-accent-tertiary rounded-lg p-6 sm:p-8 text-text-on-tertiary mb-8">
            <p className="font-body text-text-inverse/85 max-w-2xl">{heroSubtitle}</p>

            {hasApplied && (
              <>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-text-inverse/20">
                  <OutcomeStat label="Applications sent" value={status.appliedCount} />
                  <OutcomeStat label="Got to interview" value={status.interviewingCount} />
                  <OutcomeStat label="Offers" value={status.offerCount} />
                </div>
                <p className="font-body text-xs text-text-inverse/70 mt-4">
                  Update a cover letter&apos;s status when you hear back and this keeps track for you.
                </p>
              </>
            )}
          </div>
        )}

        {/* The three stages of the journey, in the order the CV page's own
            header advertises: build it, write for a role, prepare to talk
            about it. Presented in sequence rather than as unordered peers. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ActionCard
            step={1}
            title="Build Your CV"
            description={
              hasAnalysedCv
                ? 'Keep refining it as your experience grows'
                : hasCv
                  ? 'Get coaching feedback on what you have so far'
                  : 'Upload your CV and get specific, honest feedback'
            }
            icon="📝"
            iconLabel="CV document"
            badge={hasAnalysedCv ? 'Reviewed' : hasCv ? 'Draft' : null}
            actionLabel={hasCv ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/cv')}
          />

          <ActionCard
            step={2}
            title="Write a Cover Letter"
            description={
              hasApplied
                ? 'Write another for the next role you go for'
                : hasCoverLetter
                  ? 'Finish your draft and mark it applied when you send it'
                  : 'Answer a few questions once, reuse them for every letter after'
            }
            icon="✉️"
            iconLabel="Envelope"
            badge={hasApplied ? `${status?.appliedCount} sent` : hasCoverLetter ? 'Draft' : null}
            actionLabel={hasCoverLetter ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/cover-letters')}
          />

          <ActionCard
            step={3}
            title="Practice Interviews"
            description={
              hasInterviewed
                ? 'Keep practising — your answers sharpen with repetition'
                : 'Answer real film industry questions and get feedback'
            }
            icon="🎤"
            iconLabel="Microphone"
            badge={
              hasInterviewed
                ? `${status?.interviewSessionCount} session${status?.interviewSessionCount === 1 ? '' : 's'}`
                : null
            }
            actionLabel={hasInterviewed ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/coaching')}
          />
        </div>

        {/* Getting Started Guide - shown until dismissed or all steps are done */}
        {showGettingStarted && (
          <div className="bg-bg-surface rounded-lg shadow p-6 relative">
            <button
              onClick={handleDismissGettingStarted}
              disabled={dismissing}
              aria-label="Dismiss Getting Started guide"
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition text-lg leading-none disabled:opacity-50"
            >
              &times;
            </button>
            <h3 className="font-display text-lg font-bold text-text-primary mb-4">
              <span aria-hidden="true">🚀</span> Getting Started
            </h3>
            <div className="space-y-3">
              <Step number={1} text="Upload your CV and get coaching feedback on it" done={hasCv} />
              <Step number={2} text="Write a cover letter for a role you actually want" done={hasCoverLetter} />
              <Step number={3} text="Practice interview questions and get feedback on your answers" done={hasInterviewed} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function OutcomeStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-text-on-tertiary tabular-nums">{value}</div>
      <p className="font-body text-xs text-text-inverse/70 mt-0.5">{label}</p>
    </div>
  );
}

function ActionCard({ step, title, description, icon, iconLabel, badge, actionLabel, onClick }: {
  step: number;
  title: string;
  description: string;
  icon: string;
  iconLabel: string;
  /** Real progress state ("Draft", "Reviewed", "2 sent"), or null if not begun. */
  badge: string | null;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-bg-surface hover:bg-bg-main rounded-lg p-6 text-left transition transform hover:scale-105 border border-border-hairline relative"
    >
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-body font-medium text-text-on-success bg-success/25 px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-body text-xs font-bold text-accent-tertiary" aria-hidden="true">
          {step}.
        </span>
        <span className="text-4xl" aria-hidden="true">{icon}</span>
      </div>
      <span className="sr-only">{iconLabel}</span>
      <h3 className="font-display text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="font-body text-sm text-text-secondary mb-3">{description}</p>
      <span className="font-body text-sm font-medium text-text-link">{actionLabel} &rarr;</span>
    </button>
  );
}

function Step({ number, text, done }: { number: number; text: string; done: boolean }) {
  return (
    <div className="flex items-start">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
          done
            ? 'bg-success text-text-on-success'
            : 'bg-accent-tertiary text-text-on-tertiary'
        }`}
      >
        {done ? '✓' : number}
      </div>
      <p className={`font-body ml-3 ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
        {text}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
