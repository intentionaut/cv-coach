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
      className={`font-body flex flex-col items-center justify-center p-4 rounded-lg border-2 transition ${
        selected
          ? 'border-accent-tertiary bg-accent-secondary/20'
          : 'border-border-hairline hover:border-accent-tertiary hover:bg-bg-main'
      }`}
    >
      <span className={`font-display text-2xl font-bold mb-1 ${selected ? 'text-accent-tertiary' : 'text-text-secondary'}`}>
        {value}
      </span>
      <span className="font-body text-xs text-text-secondary">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-bg-surface shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="font-display text-2xl font-bold text-text-primary">Session Complete!</h1>
          <p className="font-body text-sm text-text-secondary">How did you feel about your performance?</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-surface rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
              Great work completing the practice session!
            </h2>
            <p className="font-body text-text-secondary">
              Take a moment to reflect on how confident and clear you felt overall.
            </p>
          </div>

          {/* Overall Confidence Rating */}
          <div className="mb-8">
            <label className="font-display block text-lg font-bold text-text-primary mb-4">
              Overall Confidence
            </label>
            <p className="font-body text-sm text-text-secondary mb-4">
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
            <label className="font-display block text-lg font-bold text-text-primary mb-4">
              Overall Clarity
            </label>
            <p className="font-body text-sm text-text-secondary mb-4">
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
            <label className="font-display block text-lg font-bold text-text-primary mb-4">
              Notes (Optional)
            </label>
            <p className="font-body text-sm text-text-secondary mb-4">
              Any thoughts or observations from this session?
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="font-body w-full h-32 p-4 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none bg-bg-surface text-text-primary"
              placeholder="e.g., 'Struggled with technical questions but felt good about teamwork examples...'"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/coaching')}
              className="font-body flex-1 px-6 py-4 text-text-secondary bg-bg-surface border-2 border-border-hairline rounded-lg font-semibold hover:bg-bg-main transition"
            >
              Skip for Now
            </button>
            <button
              onClick={completeSession}
              disabled={submitting || !overallConfidence || !overallClarity}
              className="font-body flex-1 px-6 py-4 bg-cta-primary text-text-on-cta rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
