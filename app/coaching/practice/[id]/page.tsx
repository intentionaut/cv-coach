'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getGenericPracticeSet, InterviewQuestion } from '@/lib/data/interview-questions';

interface Answer {
  question_id: string;
  written_answer: string;
  confidence_score: number | null;
  clarity_score: number | null;
  ai_feedback: any;
}

function PracticeSessionContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Load questions for this session
    const practiceQuestions = getGenericPracticeSet(6);
    setQuestions(practiceQuestions);
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const submitAnswer = async (confidenceScore: number | null, clarityScore: number | null) => {
    if (!currentAnswer.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_session_id: sessionId,
          question_id: currentQuestion.id,
          question: currentQuestion.question,
          question_category: currentQuestion.category,
          question_difficulty: currentQuestion.difficulty,
          written_answer: currentAnswer,
          confidence_score: confidenceScore,
          clarity_score: clarityScore
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Store answer
        const newAnswer: Answer = {
          question_id: currentQuestion.id,
          written_answer: currentAnswer,
          confidence_score: confidenceScore,
          clarity_score: clarityScore,
          ai_feedback: data.feedback
        };

        setAnswers([...answers, newAnswer]);
        setCurrentFeedback(data.feedback);
        setShowingFeedback(true);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setShowingFeedback(false);
    setCurrentAnswer('');
    setCurrentFeedback(null);

    if (isLastQuestion) {
      // Go to completion page
      router.push(`/coaching/complete/${sessionId}`);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const skipToCompletion = () => {
    router.push(`/coaching/complete/${sessionId}`);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-tertiary mx-auto mb-4"></div>
          <p className="font-body text-text-secondary">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-text-primary">Interview Practice Session</h1>
              <p className="font-body text-sm text-text-secondary">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <button
              onClick={skipToCompletion}
              className="font-body text-sm text-text-secondary hover:text-text-primary"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showingFeedback ? (
          /* Question View */
          <div className="bg-bg-surface rounded-lg shadow-lg p-8 border border-border-hairline">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-sm font-medium text-text-secondary">Progress</span>
                <span className="font-body text-sm text-text-secondary">
                  {currentIndex + 1}/{questions.length}
                </span>
              </div>
              <div className="w-full bg-bg-main rounded-full h-2">
                <div
                  className="bg-accent-tertiary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="font-body inline-block px-3 py-1 bg-accent-secondary/25 text-accent-tertiary rounded-full text-sm font-medium mb-4">
                {currentQuestion.category}
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-3">
                {currentQuestion.question}
              </h2>
              {currentQuestion.context && (
                <p className="font-body text-text-secondary bg-accent-secondary/15 border-l-4 border-accent-secondary p-4 rounded">
                  💡 {currentQuestion.context}
                </p>
              )}
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="font-display block text-sm font-bold text-text-primary mb-2">
                Your Answer
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="font-body w-full h-64 p-4 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none bg-bg-main text-text-primary"
                placeholder="Take your time to craft a thoughtful answer... There's no time pressure."
              />
              <p className="font-body text-sm text-text-secondary mt-2">
                {currentAnswer.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="font-body px-6 py-3 text-text-secondary hover:bg-bg-main rounded-lg font-medium transition"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={() => submitAnswer(null, null)}
                disabled={!currentAnswer.trim() || submitting}
                className="font-body px-8 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : isLastQuestion ? 'Submit Final Answer' : 'Submit & Continue'}
              </button>
            </div>
          </div>
        ) : (
          /* Feedback View */
          <div className="bg-bg-surface rounded-lg shadow-lg p-8 border border-border-hairline">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">AI Feedback</h2>
              <p className="font-body text-text-secondary">Here's how you did on this question</p>
            </div>

            {currentFeedback && (
              <div className="space-y-6 mb-8">
                {/* Overall Impression */}
                {currentFeedback.overallImpression && (
                  <div className="bg-accent-secondary/15 border-l-4 border-accent-secondary p-4 rounded">
                    <p className="font-body text-text-primary">{currentFeedback.overallImpression}</p>
                  </div>
                )}

                {/* Strengths */}
                {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-text-on-success mb-2 flex items-center gap-2">
                      <span className="text-xl">✓</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {currentFeedback.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="font-body flex items-start gap-2 text-text-secondary">
                          <span className="text-success mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-text-on-alert mb-2 flex items-center gap-2">
                      <span className="text-xl">→</span> Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {currentFeedback.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="font-body flex items-start gap-2 text-text-secondary">
                          <span className="text-cta-primary mt-1">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Revision */}
                {currentFeedback.suggestedRevision && (
                  <div className="bg-accent-secondary/15 border-l-4 border-accent-tertiary p-4 rounded">
                    <h3 className="font-display font-bold text-accent-tertiary mb-2">Suggested Revision</h3>
                    <p className="font-body text-text-secondary">{currentFeedback.suggestedRevision}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={nextQuestion}
              className="font-body w-full px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg text-lg font-bold hover:opacity-90 transition"
            >
              {isLastQuestion ? 'Complete Session →' : 'Next Question →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <ProtectedRoute>
      <PracticeSessionContent />
    </ProtectedRoute>
  );
}
