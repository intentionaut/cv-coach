'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PhoneCallSimulator from '@/components/interview/PhoneCallSimulator';
import { getGenericPracticeSet } from '@/lib/data/interview-questions';
import type { InterviewQuestion } from '@/lib/data/interview-questions';

function VoicePracticeContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string | undefined>();
  const [currentFeedback, setCurrentFeedback] = useState<any | undefined>();
  const [currentError, setCurrentError] = useState<string | undefined>();
  const [lastRecording, setLastRecording] = useState<{ blob: Blob; duration: number } | undefined>();

  useEffect(() => {
    // Load 6 random questions for practice
    const practiceQuestions = getGenericPracticeSet(6);
    setQuestions(practiceQuestions);
  }, []);

  const submitRecording = async (audioBlob: Blob, duration: number) => {
    const currentQuestion = questions[currentIndex];
    console.log('Uploading audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
    setIsProcessing(true);
    setCurrentError(undefined);

    // Upload and transcribe audio
    const formData = new FormData();
    formData.append('audio', audioBlob, `answer-${currentQuestion.id}.webm`);
    formData.append('practice_session_id', sessionId);
    formData.append('question_id', currentQuestion.id);
    formData.append('question', currentQuestion.question);
    formData.append('question_category', currentQuestion.category);
    formData.append('question_difficulty', currentQuestion.difficulty);

    try {
      const response = await fetch('/api/interview/voice-answer', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTranscript(data.transcript);
        setCurrentFeedback(data.feedback);
        setLastRecording(undefined);
      } else {
        const data = await response.json().catch(() => null);
        setCurrentError(data?.error || 'Failed to process your answer. Please try again.');
        setLastRecording({ blob: audioBlob, duration });
      }
    } catch (error) {
      console.error('Failed to upload audio:', error);
      setCurrentError('Failed to upload your answer. Please check your connection and try again.');
      setLastRecording({ blob: audioBlob, duration });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    submitRecording(audioBlob, duration);
  };

  const handleRetry = () => {
    if (lastRecording) {
      submitRecording(lastRecording.blob, lastRecording.duration);
    }
  };

  const handleContinue = () => {
    // Clear feedback/error state
    setCurrentTranscript(undefined);
    setCurrentFeedback(undefined);
    setCurrentError(undefined);
    setLastRecording(undefined);

    // Move to next question or complete session
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All questions answered - go to completion page
      router.push(`/coaching/complete/${sessionId}`);
    }
  };

  const handleSkipQuestion = () => {
    setCurrentTranscript(undefined);
    setCurrentFeedback(undefined);
    setCurrentError(undefined);
    setLastRecording(undefined);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push(`/coaching/complete/${sessionId}`);
    }
  };

  const handleHangUp = () => {
    // Route to completion page regardless of how many questions answered
    // The completion page will show feedback for whatever was completed
    router.push(`/coaching/complete/${sessionId}`);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <PhoneCallSimulator
      question={currentQuestion.question}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      onRecordingComplete={handleRecordingComplete}
      onSkip={handleSkipQuestion}
      onHangUp={handleHangUp}
      transcript={currentTranscript}
      feedback={currentFeedback}
      isProcessing={isProcessing}
      onContinue={handleContinue}
      error={currentError}
      onRetry={lastRecording ? handleRetry : undefined}
    />
  );
}

export default function VoicePracticePage() {
  return (
    <ProtectedRoute>
      <VoicePracticeContent />
    </ProtectedRoute>
  );
}
