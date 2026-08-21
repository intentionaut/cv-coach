'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface DashboardStatus {
  cvCount: number;
  interviewSessionCount: number;
  latestInterviewAt: string | null;
  skillsAssessedCount: number;
  gettingStartedDismissed: boolean;
}

function DashboardContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStatus(data))
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
  const hasInterviewed = (status?.interviewSessionCount ?? 0) > 0;
  const hasSkillsAssessed = (status?.skillsAssessedCount ?? 0) > 0;
  const allStepsDone = status !== null && hasCv && hasInterviewed && hasSkillsAssessed;
  const showGettingStarted = status !== null && !status.gettingStartedDismissed && !allStepsDone;

  const heroSubtitle = status === null
    ? 'AI-powered coaching to help you land your first gig in the film industry'
    : allStepsDone
      ? `${status.interviewSessionCount} interview session${status.interviewSessionCount === 1 ? '' : 's'} completed — keep the momentum going`
      : 'AI-powered coaching to help you land your first gig in the film industry';

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/friday-logo.png" alt="" width={31} height={31} />
              <h1 className="font-display text-2xl font-bold text-text-primary">Friday</h1>
            </div>
            <p className="font-body text-sm text-text-secondary">
              {sessionStatus === 'loading' ? ' ' : `Welcome back, ${session?.user?.name?.split(' ')[0]}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session?.user?.email === 'dasilvasaielle@gmail.com' && (
              <button
                onClick={() => router.push('/admin/invite')}
                title="Admin only"
                className="font-body px-4 py-2 text-sm text-accent-tertiary border border-accent-tertiary/30 hover:bg-accent-tertiary/10 rounded-lg transition"
              >
                Invite User
              </button>
            )}
            <button
              onClick={() => router.push('/settings')}
              className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
            >
              Settings
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="font-body px-4 py-2 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-main rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-accent-tertiary rounded-lg p-8 text-text-on-tertiary mb-8">
          <h2 className="font-display text-3xl font-bold mb-2">Your Film Career Journey</h2>
          <p className="font-body text-text-inverse/75">{heroSubtitle}</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Build Your CV"
            description={
              hasCv
                ? 'Keep refining your CV as your experience grows'
                : 'Create your professional CV with your experience and projects'
            }
            icon="📝"
            iconLabel="CV document"
            done={hasCv}
            actionLabel={hasCv ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/cv')}
          />

          <ActionCard
            title="Practice Interviews"
            description={
              hasInterviewed
                ? `${status?.interviewSessionCount} session${status?.interviewSessionCount === 1 ? '' : 's'} completed — keep practicing`
                : 'Answer film industry questions and get AI-powered feedback'
            }
            icon="🎤"
            iconLabel="Microphone"
            done={hasInterviewed}
            actionLabel={hasInterviewed ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/coaching')}
          />

          <ActionCard
            title="Skills Assessment"
            description={
              hasSkillsAssessed
                ? 'Revisit your skills as you grow'
                : 'Track your technical, creative, and soft skills progress'
            }
            icon="⭐"
            iconLabel="Star"
            done={hasSkillsAssessed}
            actionLabel={hasSkillsAssessed ? 'Continue' : 'Get Started'}
            onClick={() => router.push('/skills')}
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
              <Step number={1} text="Build your CV with your experience, education, and projects" done={hasCv} />
              <Step number={2} text="Practice interview questions and get personalized feedback" done={hasInterviewed} />
              <Step number={3} text="Track your skills and monitor your improvement over time" done={hasSkillsAssessed} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ActionCard({ title, description, icon, iconLabel, done, actionLabel, onClick }: {
  title: string;
  description: string;
  icon: string;
  iconLabel: string;
  done: boolean;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-bg-surface hover:bg-bg-main rounded-lg p-6 text-left transition transform hover:scale-105 border border-border-hairline relative"
    >
      {done && (
        <span className="absolute top-4 right-4 text-xs font-body font-medium text-success bg-success/10 px-2 py-1 rounded-full">
          Started
        </span>
      )}
      <div className="text-4xl mb-3" aria-hidden="true">
        {icon}
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
