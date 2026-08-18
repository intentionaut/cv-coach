'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV Coach</h1>
            <p className="text-sm text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Film Career Journey</h2>
          <p className="text-purple-100">
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
            color="bg-blue-50 hover:bg-blue-100"
          />

          <ActionCard
            title="Practice Interviews"
            description="Answer film industry questions and get AI-powered feedback"
            icon="🎤"
            onClick={() => router.push('/coaching')}
            color="bg-purple-50 hover:bg-purple-100"
          />

          <ActionCard
            title="Skills Assessment"
            description="Track your technical, creative, and soft skills progress"
            icon="⭐"
            onClick={() => router.push('/skills')}
            color="bg-green-50 hover:bg-green-100"
          />

          <ActionCard
            title="Tailor CV"
            description="Get AI suggestions to customize your CV for specific roles"
            icon="🎯"
            onClick={() => router.push('/cv/tailor')}
            color="bg-orange-50 hover:bg-orange-100"
          />

          <ActionCard
            title="View Progress"
            description="See your improvement over time and coaching recommendations"
            icon="📈"
            onClick={() => router.push('/progress')}
            color="bg-pink-50 hover:bg-pink-100"
          />

          <ActionCard
            title="Job Roles"
            description="Save job descriptions you're interested in"
            icon="💼"
            onClick={() => router.push('/roles')}
            color="bg-indigo-50 hover:bg-indigo-100"
          />
        </div>

        {/* Getting Started Guide */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Getting Started</h3>
          <div className="space-y-3">
            <Step number={1} text="Build your CV with your experience, education, and projects" />
            <Step number={2} text="Add job roles you're interested in from film industry postings" />
            <Step number={3} text="Use AI to tailor your CV for each specific role" />
            <Step number={4} text="Practice interview questions and get personalized feedback" />
            <Step number={5} text="Track your skills and monitor your improvement over time" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ActionCard({ title, description, icon, onClick, color }: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} rounded-lg p-6 text-left transition transform hover:scale-105 border border-gray-200`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <p className="ml-3 text-gray-700">{text}</p>
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
