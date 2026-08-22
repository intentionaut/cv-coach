'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ChevronDownIcon } from '@/components/ui/icons';
import { EVENTS, track } from '@/lib/analytics/events';
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
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  // Captured BEFORE feedback is shown. That ordering is the whole point:
  // once you've seen an assessment you anchor to it, and the self-rating
  // stops measuring your own judgement of your answer.
  const [selfClarity, setSelfClarity] = useState<number | null>(null);
  const [selfConfidence, setSelfConfidence] = useState<number | null>(null);
  // Prior answers to this same question, fetched only after submitting.
  const [priorAnswer, setPriorAnswer] = useState<{ written_answer: string; completed_at: string } | null>(null);

  useEffect(() => {
    // Load questions for this session
    const practiceQuestions = getGenericPracticeSet(6);
    setQuestions(practiceQuestions);

    // Surface which role this session is tied to, so the user can see the
    // practice is connected to a specific job rather than generic.
    (async () => {
      try {
        const response = await fetch(`/api/interview/sessions/${sessionId}`);
        if (!response.ok) return;
        const data = await response.json();
        const s = data.session;
        const label = s?.cv_job_title?.trim() || s?.cv_name || null;
        setRoleLabel(label);
      } catch (error) {
        console.error('Failed to load session context:', error);
      }
    })();
  }, [sessionId]);

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

        const assessed = data.feedback?.assessedClarity;
        track(EVENTS.PRACTICE_ANSWER_SUBMITTED, {
          questionCategory: currentQuestion.category,
          questionDifficulty: currentQuestion.difficulty,
          answerLength: currentAnswer.length,
          selfRated: clarityScore !== null,
          // The calibration gap itself: negative means they under-rated their
          // own answer, positive means they over-rated it. Worth tracking in
          // aggregate - if learners systematically over-rate, that's a
          // pedagogical finding, not just a per-answer nicety.
          calibrationDelta:
            clarityScore !== null && typeof assessed === 'number'
              ? clarityScore - assessed
              : null,
          starApplicable: data.feedback?.starApplicable ?? null,
          starComplete:
            data.feedback?.starApplicable && data.feedback?.star
              ? Object.values(data.feedback.star).every((p: any) => p?.present)
              : null
        });

        // Deliberately fetched only now, never before submitting: seeing your
        // old answer first would just invite copying it, which defeats the
        // practice. Afterwards it's the clearest evidence of improvement the
        // product can show.
        try {
          const histRes = await fetch(
            `/api/interview/question-history?question=${encodeURIComponent(currentQuestion.question)}`
          );
          if (histRes.ok) {
            const hist = await histRes.json();
            const previous = (hist.responses || []).filter(
              (r: any) => r.written_answer && r.written_answer !== currentAnswer
            );
            if (previous.length > 0) setPriorAnswer(previous[previous.length - 1]);
          }
        } catch (err) {
          console.error('Failed to load question history:', err);
        }
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
    setSelfClarity(null);
    setSelfConfidence(null);
    setPriorAnswer(null);

    if (isLastQuestion) {
      track(EVENTS.PRACTICE_COMPLETED, {
        questionsAnswered: answers.length,
        minutes: Math.round((Date.now() - startTime) / 60000),
        wasRoleSpecific: !!roleLabel
      });
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
              <h1 className="font-display text-xl font-bold text-text-primary">
                {roleLabel ? `Practising for ${roleLabel}` : 'Interview Practice Session'}
              </h1>
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

            {/* Asked before feedback, deliberately. Comparing your own read
                of an answer against an outside one is where the learning is -
                but only if you commit to a view first. */}
            {currentAnswer.trim() && (
              <div className="mb-6 bg-bg-main rounded-lg border border-border-hairline p-4">
                <p className="font-display text-sm font-bold text-text-primary mb-1">
                  Before you submit — how do you think that went?
                </p>
                <p className="font-body text-xs text-text-secondary mb-3">
                  Optional, but comparing your read against the feedback is the most useful part.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelfRating
                    label="How clear was it?"
                    value={selfClarity}
                    onChange={setSelfClarity}
                    lowLabel="Rambled"
                    highLabel="Crystal clear"
                  />
                  <SelfRating
                    label="How confident did you feel?"
                    value={selfConfidence}
                    onChange={setSelfConfidence}
                    lowLabel="Shaky"
                    highLabel="Very"
                  />
                </div>
              </div>
            )}

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
                onClick={() => submitAnswer(selfConfidence, selfClarity)}
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
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Feedback</h2>
              <p className="font-body text-text-secondary">
                What landed, and the questions worth sitting with before you answer this again.
              </p>
            </div>

            {currentFeedback && (
              <div className="space-y-6 mb-8">
                {/* You've answered this before. Shown after feedback, never
                    before - the point is to see how far you've come, not to
                    copy last time's attempt. */}
                {priorAnswer && (
                  <details className="group bg-bg-main rounded-lg border border-border-hairline overflow-hidden">
                    <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-bg-surface transition">
                      <span className="font-body text-sm font-medium text-text-primary">
                        You answered this before — see what you wrote
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-text-secondary group-open:rotate-180 transition shrink-0" />
                    </summary>
                    <div className="px-4 pb-4 border-t border-border-hairline pt-3">
                      <p className="font-body text-xs text-text-secondary mb-2">
                        {new Date(priorAnswer.completed_at).toLocaleDateString()}
                      </p>
                      <p className="font-body text-sm text-text-secondary whitespace-pre-wrap">
                        {priorAnswer.written_answer}
                      </p>
                    </div>
                  </details>
                )}

                {/* Calibration: only shown when they committed to a self-rating
                    before seeing this, otherwise there's nothing to compare. */}
                {selfClarity !== null && typeof currentFeedback.assessedClarity === 'number' && (
                  <CalibrationGap self={selfClarity} assessed={currentFeedback.assessedClarity} />
                )}

                {currentFeedback.overallImpression && (
                  <div className="bg-accent-secondary/15 border-l-4 border-accent-secondary p-4 rounded">
                    <p className="font-body text-text-primary">{currentFeedback.overallImpression}</p>
                    {currentFeedback.clarityNote && (
                      <p className="font-body text-sm text-text-secondary mt-2">{currentFeedback.clarityNote}</p>
                    )}
                  </div>
                )}

                {/* STAR, per component. Far more actionable than prose about
                    "structure", and it's the vocabulary careers services
                    already teach. Hidden entirely for motivational questions,
                    where forcing STAR would be bad advice. */}
                {currentFeedback.starApplicable && currentFeedback.star && (
                  <div>
                    <h3 className="font-display font-bold text-text-primary mb-1">Structure</h3>
                    <p className="font-body text-xs text-text-secondary mb-3">
                      Behavioural answers land best as Situation, Task, Action, Result.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(['situation', 'task', 'action', 'result'] as const).map(key => {
                        const part = currentFeedback.star[key];
                        if (!part) return null;
                        return (
                          <div
                            key={key}
                            className={`rounded-lg border p-3 ${
                              part.present
                                ? 'border-success/40 bg-success/10'
                                : 'border-cta-primary/40 bg-cta-primary/10'
                            }`}
                          >
                            <p className="font-body text-sm font-bold text-text-primary capitalize flex items-center gap-1.5">
                              <span className={part.present ? 'text-success' : 'text-text-cta'}>
                                {part.present ? '✓' : '✕'}
                              </span>
                              {key}
                            </p>
                            {part.note && (
                              <p className="font-body text-xs text-text-secondary mt-1">{part.note}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-text-on-success mb-2 flex items-center gap-2">
                      <span className="text-xl">✓</span> What worked
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

                {/* Questions, not instructions - the answer stays theirs. */}
                {currentFeedback.questions && currentFeedback.questions.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-text-primary mb-2">Worth thinking about</h3>
                    <ul className="space-y-2">
                      {currentFeedback.questions.map((q: string, idx: number) => (
                        <li key={idx} className="font-body flex items-start gap-2 text-text-secondary">
                          <span className="text-accent-tertiary mt-1">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
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

function SelfRating({
  label,
  value,
  onChange,
  lowLabel,
  highLabel
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-text-primary mb-1.5">{label}</p>
      <div className="flex items-center gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`font-body w-9 h-9 rounded-lg border-2 text-sm font-bold transition ${
              value === n
                ? 'border-accent-tertiary bg-accent-secondary/25 text-text-primary'
                : 'border-border-hairline bg-bg-surface text-text-secondary hover:border-accent-tertiary/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-body text-[10px] text-text-secondary">{lowLabel}</span>
        <span className="font-body text-[10px] text-text-secondary">{highLabel}</span>
      </div>
    </div>
  );
}

/**
 * The calibration gap: your own read of an answer against an outside one.
 * Both directions matter - over-rating shows a blind spot, under-rating
 * shows you're harder on yourself than the answer deserves - so this is
 * deliberately framed as information rather than a mark.
 */
function CalibrationGap({ self, assessed }: { self: number; assessed: number }) {
  const delta = self - assessed;
  const message =
    delta >= 2
      ? `You rated this ${self}. It read as a ${assessed} — worth looking at what didn't land the way you expected.`
      : delta <= -2
        ? `You rated this ${self}, but it read as a ${assessed}. You're being harder on yourself than this answer deserves.`
        : delta === 0
          ? `You rated this ${self}, and it read as a ${assessed}. Your sense of your own answers is well calibrated.`
          : `You rated this ${self}, it read as a ${assessed} — close, so you're reading your own answers pretty accurately.`;

  const tone =
    Math.abs(delta) >= 2
      ? 'bg-alert/25 border-alert'
      : 'bg-success/15 border-success/40';

  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <p className="font-display text-sm font-bold text-text-primary mb-1">Your read vs. this one</p>
      <p className="font-body text-sm text-text-primary">{message}</p>
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
