'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Friday</h1>
            <p className="font-body text-sm text-text-secondary">Welcome back, {session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/settings')}
              className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
            >
              Settings
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="font-body px-4 py-2 text-sm text-text-secondary hover:bg-bg-main rounded-lg transition"
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
          <p className="font-body text-text-inverse/75">
            AI-powered coaching to help you land your first gig in the film industry
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Build Your CV"
            description="Create and manage your professional CV with your experience and projects"
            icon="📝"
            onClick={() => router.push('/cv')}
          />

          <ActionCard
            title="Practice Interviews"
            description="Answer film industry questions and get AI-powered feedback"
            icon="🎤"
            onClick={() => router.push('/coaching')}
          />

          <ActionCard
            title="Skills Assessment"
            description="Track your technical, creative, and soft skills progress"
            icon="⭐"
            onClick={() => router.push('/skills')}
          />
        </div>

        {/* Getting Started Guide */}
        <div className="bg-bg-surface rounded-lg shadow p-6">
          <h3 className="font-display text-lg font-bold text-text-primary mb-4">🚀 Getting Started</h3>
          <div className="space-y-3">
            <Step number={1} text="Build your CV with your experience, education, and projects" />
            <Step number={2} text="Practice interview questions and get personalized feedback" />
            <Step number={3} text="Track your skills and monitor your improvement over time" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ActionCard({ title, description, icon, onClick }: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-bg-surface hover:bg-bg-main rounded-lg p-6 text-left transition transform hover:scale-105 border border-border-hairline border-l-4 border-l-accent-tertiary"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-display text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="font-body text-sm text-text-secondary">{description}</p>
    </button>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 w-8 h-8 bg-accent-tertiary text-text-on-tertiary rounded-full flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <p className="font-body ml-3 text-text-primary">{text}</p>
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
