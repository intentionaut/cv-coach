'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

function SkillsContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="font-body text-text-link hover:text-text-cta mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="font-display text-2xl font-bold text-text-primary">Skills Assessment</h1>
          <p className="font-body text-sm text-text-secondary">Track your skills and progress</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-surface rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-4">Skills Assessment Coming Soon</h2>
          <p className="font-body text-text-secondary mb-6">
            Track and improve your skills across categories:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-bg-main border border-l-4 border-border-hairline border-l-accent-tertiary p-4 rounded-lg">
              <h3 className="font-display font-bold text-text-primary mb-2">Technical Skills</h3>
              <p className="font-body text-sm text-text-secondary">Camera, lighting, editing software</p>
            </div>
            <div className="bg-bg-main border border-l-4 border-border-hairline border-l-cta-primary p-4 rounded-lg">
              <h3 className="font-display font-bold text-text-primary mb-2">Creative Skills</h3>
              <p className="font-body text-sm text-text-secondary">Storytelling, direction, cinematography</p>
            </div>
            <div className="bg-success/15 border border-l-4 border-border-hairline border-l-success p-4 rounded-lg">
              <h3 className="font-display font-bold text-text-on-success mb-2">Production Skills</h3>
              <p className="font-body text-sm text-text-on-success">Project management, budgeting</p>
            </div>
            <div className="bg-accent-secondary/20 border border-l-4 border-border-hairline border-l-accent-secondary p-4 rounded-lg">
              <h3 className="font-display font-bold text-text-primary mb-2">Soft Skills</h3>
              <p className="font-body text-sm text-text-secondary">Communication, teamwork, problem-solving</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SkillsPage() {
  return (
    <ProtectedRoute>
      <SkillsContent />
    </ProtectedRoute>
  );
}
