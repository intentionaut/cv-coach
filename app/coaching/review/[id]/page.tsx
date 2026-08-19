'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface SessionResponse {
  id: string;
  question: string;
  question_category: string;
  written_answer: string;
  confidence_score: number | null;
  clarity_score: number | null;
  ai_feedback: any;
  completed_at: string;
}

interface SessionData {
  session: {
    id: string;
    title: string;
    started_at: string;
    completed_at: string | null;
    overall_confidence: number | null;
    overall_clarity: number | null;
    notes: string | null;
    role_title: string | null;
  };
  responses: SessionResponse[];
}

function SessionReviewContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        setData(sessionData);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
          <button
            onClick={() => router.push('/coaching')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            ← Back to Coaching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/coaching')}
            className="text-purple-600 hover:text-purple-700 mb-2"
          >
            ← Back to Coaching
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{data.session.title}</h1>
          <p className="text-sm text-gray-600">
            {new Date(data.session.started_at).toLocaleDateString()} •{' '}
            {data.responses.length} questions answered
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.session.overall_confidence && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Overall Confidence</div>
                <div className="text-3xl font-bold text-purple-600">
                  {data.session.overall_confidence}/5
                </div>
              </div>
            )}
            {data.session.overall_clarity && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Overall Clarity</div>
                <div className="text-3xl font-bold text-blue-600">
                  {data.session.overall_clarity}/5
                </div>
              </div>
            )}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Questions Answered</div>
              <div className="text-3xl font-bold text-green-600">
                {data.responses.length}
              </div>
            </div>
          </div>
          {data.session.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Your Notes:</div>
              <p className="text-gray-600">{data.session.notes}</p>
            </div>
          )}
        </div>

        {/* Question Responses */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Answers</h2>
          {data.responses.map((response, idx) => {
            const isExpanded = expandedQuestions.has(response.id);
            const feedback = response.ai_feedback;

            return (
              <div key={response.id} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  onClick={() => toggleQuestion(response.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {response.question_category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{response.question}</h3>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    {/* Your Answer */}
                    <div className="mt-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Your Answer:</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{response.written_answer}</p>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {feedback && (
                      <div className="space-y-4">
                        {feedback.overallImpression && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                            <p className="text-gray-800">{feedback.overallImpression}</p>
                          </div>
                        )}

                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                              <span className="text-xl">✓</span> Strengths
                            </h4>
                            <ul className="space-y-2">
                              {feedback.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700">
                                  <span className="text-green-600 mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.improvements && feedback.improvements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                              <span className="text-xl">→</span> Areas to Improve
                            </h4>
                            <ul className="space-y-2">
                              {feedback.improvements.map((improvement: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700">
                                  <span className="text-orange-600 mt-1">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.suggestedRevision && (
                          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                            <h4 className="font-semibold text-purple-900 mb-2">Suggested Revision</h4>
                            <p className="text-gray-700">{feedback.suggestedRevision}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/coaching')}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Back to Sessions
          </button>
          <button
            onClick={() => router.push('/coaching')}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Start New Practice
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SessionReviewPage() {
  return (
    <ProtectedRoute>
      <SessionReviewContent />
    </ProtectedRoute>
  );
}
