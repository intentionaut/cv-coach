'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

interface PracticeSession {
  id: string;
  title: string;
  started_at: string;
  completed_at: string | null;
  total_time_minutes: number;
  overall_confidence: number | null;
  overall_clarity: number | null;
  question_count: number;
}

function CoachingContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'General Film Industry Practice',
          session_type: 'general'
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/coaching/practice/${data.sessionId}`);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Interview Practice</h1>
          <p className="text-sm text-gray-600">Build confidence with written interview practice</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Start New Session Card */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-8 text-white mb-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-3">Ready to Practice?</h2>
            <p className="text-purple-100 mb-6">
              Answer 6 common film industry interview questions in writing. Take your time to think through each answer - there's no time pressure.
            </p>
            <button
              onClick={startNewSession}
              className="px-8 py-4 bg-white text-purple-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Start 30-Minute Practice Session →
            </button>
          </div>
        </div>

        {/* Past Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Practice History</h3>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No practice sessions yet</h3>
              <p className="text-gray-600">
                Start your first practice session to begin building your interview confidence!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/coaching/review/${session.id}`)}
                  className="w-full px-6 py-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{session.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(session.started_at).toLocaleDateString()} • {session.question_count} questions
                        {session.total_time_minutes > 0 && ` • ${session.total_time_minutes} min`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {session.overall_confidence && (
                        <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1">Confidence</div>
                          <div className="text-lg font-bold text-purple-600">
                            {session.overall_confidence}/5
                          </div>
                        </div>
                      )}
                      {session.overall_clarity && (
                        <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1">Clarity</div>
                          <div className="text-lg font-bold text-blue-600">
                            {session.overall_clarity}/5
                          </div>
                        </div>
                      )}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
