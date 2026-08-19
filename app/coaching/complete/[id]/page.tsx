'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function SessionCompletionContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [overallClarity, setOverallClarity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const completeSession = async () => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_confidence: overallConfidence,
          overall_clarity: overallClarity,
          notes
        })
      });

      if (response.ok) {
        router.push(`/coaching/review/${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const RatingButton = ({ value, selected, onClick, label }: {
    value: number;
    selected: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition ${
        selected
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
      }`}
    >
      <span className={`text-2xl font-bold mb-1 ${selected ? 'text-purple-600' : 'text-gray-700'}`}>
        {value}
      </span>
      <span className="text-xs text-gray-600">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Session Complete!</h1>
          <p className="text-sm text-gray-600">How did you feel about your performance?</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Great work completing the practice session!
            </h2>
            <p className="text-gray-600">
              Take a moment to reflect on how confident and clear you felt overall.
            </p>
          </div>

          {/* Overall Confidence Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Overall Confidence
            </label>
            <p className="text-sm text-gray-600 mb-4">
              How confident did you feel answering these questions?
            </p>
            <div className="grid grid-cols-5 gap-3">
              <RatingButton
                value={1}
                selected={overallConfidence === 1}
                onClick={() => setOverallConfidence(1)}
                label="Not confident"
              />
              <RatingButton
                value={2}
                selected={overallConfidence === 2}
                onClick={() => setOverallConfidence(2)}
                label="Somewhat"
              />
              <RatingButton
                value={3}
                selected={overallConfidence === 3}
                onClick={() => setOverallConfidence(3)}
                label="Moderate"
              />
              <RatingButton
                value={4}
                selected={overallConfidence === 4}
                onClick={() => setOverallConfidence(4)}
                label="Confident"
              />
              <RatingButton
                value={5}
                selected={overallConfidence === 5}
                onClick={() => setOverallConfidence(5)}
                label="Very confident"
              />
            </div>
          </div>

          {/* Overall Clarity Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Overall Clarity
            </label>
            <p className="text-sm text-gray-600 mb-4">
              How clear and well-structured were your answers?
            </p>
            <div className="grid grid-cols-5 gap-3">
              <RatingButton
                value={1}
                selected={overallClarity === 1}
                onClick={() => setOverallClarity(1)}
                label="Unclear"
              />
              <RatingButton
                value={2}
                selected={overallClarity === 2}
                onClick={() => setOverallClarity(2)}
                label="Somewhat clear"
              />
              <RatingButton
                value={3}
                selected={overallClarity === 3}
                onClick={() => setOverallClarity(3)}
                label="Clear"
              />
              <RatingButton
                value={4}
                selected={overallClarity === 4}
                onClick={() => setOverallClarity(4)}
                label="Very clear"
              />
              <RatingButton
                value={5}
                selected={overallClarity === 5}
                onClick={() => setOverallClarity(5)}
                label="Extremely clear"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Notes (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Any thoughts or observations from this session?
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="e.g., 'Struggled with technical questions but felt good about teamwork examples...'"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/coaching')}
              className="flex-1 px-6 py-4 text-gray-700 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Skip for Now
            </button>
            <button
              onClick={completeSession}
              disabled={submitting || !overallConfidence || !overallClarity}
              className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Saving...' : 'Complete & Review Session'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SessionCompletionPage() {
  return (
    <ProtectedRoute>
      <SessionCompletionContent />
    </ProtectedRoute>
  );
}
