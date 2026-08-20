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
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-tertiary mx-auto mb-4"></div>
          <p className="font-body text-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-text-secondary">Session not found</p>
          <button
            onClick={() => router.push('/coaching')}
            className="font-body mt-4 text-text-link hover:text-text-cta"
          >
            ← Back to Coaching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/coaching')}
            className="font-body text-text-link hover:text-text-cta mb-2"
          >
            ← Back to Coaching
          </button>
          <h1 className="font-display text-2xl font-bold text-text-primary">{data.session.title}</h1>
          <p className="font-body text-sm text-text-secondary">
            {new Date(data.session.started_at).toLocaleDateString()} •{' '}
            {data.responses.length} questions answered
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary */}
        <div className="bg-bg-surface rounded-lg shadow p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">Session Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.session.overall_confidence && (
              <div className="text-center p-4 bg-accent-secondary/20 rounded-lg">
                <div className="font-body text-sm text-text-secondary mb-1">Overall Confidence</div>
                <div className="font-display text-3xl font-bold text-accent-tertiary">
                  {data.session.overall_confidence}/5
                </div>
              </div>
            )}
            {data.session.overall_clarity && (
              <div className="text-center p-4 bg-bg-main border border-border-hairline rounded-lg">
                <div className="font-body text-sm text-text-secondary mb-1">Overall Clarity</div>
                <div className="font-display text-3xl font-bold text-text-cta">
                  {data.session.overall_clarity}/5
                </div>
              </div>
            )}
            <div className="text-center p-4 bg-success/15 rounded-lg">
              <div className="font-body text-sm text-text-secondary mb-1">Questions Answered</div>
              <div className="font-display text-3xl font-bold text-text-on-success">
                {data.responses.length}
              </div>
            </div>
          </div>
          {data.session.notes && (
            <div className="mt-4 p-4 bg-bg-main rounded-lg">
              <div className="font-body text-sm font-medium text-text-secondary mb-2">Your Notes:</div>
              <p className="font-body text-text-secondary">{data.session.notes}</p>
            </div>
          )}
        </div>

        {/* Question Responses */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-text-primary">Your Answers</h2>
          {data.responses.map((response, idx) => {
            const isExpanded = expandedQuestions.has(response.id);
            const feedback = response.ai_feedback;

            return (
              <div key={response.id} className="bg-bg-surface rounded-lg shadow overflow-hidden border border-border-hairline">
                <button
                  onClick={() => toggleQuestion(response.id)}
                  className="w-full px-6 py-4 text-left hover:bg-bg-main transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-body inline-flex items-center justify-center w-6 h-6 bg-accent-tertiary text-text-on-tertiary rounded-full text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-body px-2 py-1 bg-bg-main text-text-secondary rounded text-xs font-medium">
                          {response.question_category}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-text-primary">{response.question}</h3>
                    </div>
                    <svg
                      className={`w-5 h-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-border-hairline">
                    {/* Your Answer */}
                    <div className="mt-4 mb-6">
                      <h4 className="font-display font-bold text-text-primary mb-2">Your Answer:</h4>
                      <div className="p-4 bg-bg-main rounded-lg">
                        <p className="font-body text-text-secondary whitespace-pre-wrap">{response.written_answer}</p>
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {feedback && (
                      <div className="space-y-4">
                        {feedback.overallImpression && (
                          <div className="bg-accent-secondary/15 border-l-4 border-accent-secondary p-4 rounded">
                            <p className="font-body text-text-primary">{feedback.overallImpression}</p>
                          </div>
                        )}

                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div>
                            <h4 className="font-display font-bold text-text-on-success mb-2 flex items-center gap-2">
                              <span className="text-xl">✓</span> Strengths
                            </h4>
                            <ul className="space-y-2">
                              {feedback.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="font-body flex items-start gap-2 text-text-secondary">
                                  <span className="text-success mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.improvements && feedback.improvements.length > 0 && (
                          <div>
                            <h4 className="font-display font-bold text-text-on-alert mb-2 flex items-center gap-2">
                              <span className="text-xl">→</span> Areas to Improve
                            </h4>
                            <ul className="space-y-2">
                              {feedback.improvements.map((improvement: string, idx: number) => (
                                <li key={idx} className="font-body flex items-start gap-2 text-text-secondary">
                                  <span className="text-cta-primary mt-1">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.suggestedRevision && (
                          <div className="bg-accent-secondary/15 border-l-4 border-accent-tertiary p-4 rounded">
                            <h4 className="font-display font-bold text-accent-tertiary mb-2">Suggested Revision</h4>
                            <p className="font-body text-text-secondary">{feedback.suggestedRevision}</p>
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
            className="font-body flex-1 px-6 py-3 bg-bg-surface border-2 border-border-hairline text-text-secondary rounded-lg font-semibold hover:bg-bg-main transition"
          >
            Back to Sessions
          </button>
          <button
            onClick={() => router.push('/coaching')}
            className="font-body flex-1 px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition"
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
