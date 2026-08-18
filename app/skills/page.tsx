'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

function SkillsContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-600 hover:text-purple-700 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Skills Assessment</h1>
          <p className="text-sm text-gray-600">Track your skills and progress</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Skills Assessment Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            Track and improve your skills across categories:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Technical Skills</h3>
              <p className="text-sm text-blue-700">Camera, lighting, editing software</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Creative Skills</h3>
              <p className="text-sm text-purple-700">Storytelling, direction, cinematography</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Production Skills</h3>
              <p className="text-sm text-green-700">Project management, budgeting</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Soft Skills</h3>
              <p className="text-sm text-orange-700">Communication, teamwork, problem-solving</p>
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
