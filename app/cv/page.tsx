'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

function CVEditorContent() {
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
          <h1 className="text-2xl font-bold text-gray-900">CV Editor</h1>
          <p className="text-sm text-gray-600">Build your professional CV</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">CV Editor Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            This feature will allow you to build and manage your professional CV with:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
            <li>• Personal information and contact details</li>
            <li>• Work experience and achievements</li>
            <li>• Education and certifications</li>
            <li>• Film projects and portfolio</li>
            <li>• Technical and creative skills</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function CVPage() {
  return (
    <ProtectedRoute>
      <CVEditorContent />
    </ProtectedRoute>
  );
}
