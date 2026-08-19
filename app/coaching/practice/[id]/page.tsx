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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Interview Practice Session</h1>
              <p className="text-sm text-gray-600">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            <button
              onClick={skipToCompletion}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showingFeedback ? (
          /* Question View */
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1}/{questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                {currentQuestion.category}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {currentQuestion.question}
              </h2>
              {currentQuestion.context && (
                <p className="text-gray-600 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  💡 {currentQuestion.context}
                </p>
              )}
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Take your time to craft a thoughtful answer... There's no time pressure."
              />
              <p className="text-sm text-gray-500 mt-2">
                {currentAnswer.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={() => submitAnswer(null, null)}
                disabled={!currentAnswer.trim() || submitting}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : isLastQuestion ? 'Submit Final Answer' : 'Submit & Continue'}
              </button>
            </div>
          </div>
        ) : (
          /* Feedback View */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Feedback</h2>
              <p className="text-gray-600">Here's how you did on this question</p>
            </div>

            {currentFeedback && (
              <div className="space-y-6 mb-8">
                {/* Overall Impression */}
                {currentFeedback.overallImpression && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="text-gray-800">{currentFeedback.overallImpression}</p>
                  </div>
                )}

                {/* Strengths */}
                {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">✓</span> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {currentFeedback.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">→</span> Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {currentFeedback.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Revision */}
                {currentFeedback.suggestedRevision && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                    <h3 className="font-semibold text-purple-900 mb-2">Suggested Revision</h3>
                    <p className="text-gray-700">{currentFeedback.suggestedRevision}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={nextQuestion}
              className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
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
