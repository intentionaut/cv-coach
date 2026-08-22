'use client';

import { useState, useEffect, useRef } from 'react';

interface PhoneCallSimulatorProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onSkip: () => void;
  onHangUp: () => void;
  transcript?: string;
  feedback?: any;
  isProcessing?: boolean;
  onContinue?: () => void;
  error?: string;
  onRetry?: () => void;
}

type CallState = 'ringing' | 'connecting' | 'ready' | 'listening' | 'processing' | 'feedback' | 'error' | 'completed';

export default function PhoneCallSimulator({
  question,
  questionNumber,
  totalQuestions,
  onRecordingComplete,
  onSkip,
  onHangUp,
  transcript,
  feedback,
  isProcessing,
  onContinue,
  error,
  onRetry
}: PhoneCallSimulatorProps) {
  const [callState, setCallState] = useState<CallState>('ringing');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Simulate phone ringing → connecting → ready sequence
    const ringTimer = setTimeout(() => setCallState('connecting'), 1500);
    const connectTimer = setTimeout(() => setCallState('ready'), 3000);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(connectTimer);
    };
  }, []);

  // Update state based on external processing/feedback/error
  useEffect(() => {
    if (isProcessing) {
      setCallState('processing');
    } else if (error) {
      setCallState('error');
    } else if (transcript && feedback) {
      setCallState('feedback');
    }
  }, [isProcessing, transcript, feedback, error]);

  // Start waveform visualization when recording starts
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      console.log('useEffect: Starting waveform visualization');
      drawWaveform();
    }
  }, [isRecording]);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) {
      console.log('Canvas or analyser not available');
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;

    if (!canvasCtx) {
      console.log('Cannot get 2D context');
      return;
    }

    console.log('Starting waveform visualization');

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) {
        console.log('Recording stopped, ending visualization');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas with dark background
      canvasCtx.fillStyle = '#3D405B'; // token: text-primary
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#E07A5F'; // token: cta-primary
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks collected:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        onRecordingComplete(audioBlob, recordingDuration);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setCallState('completed');
      };

      // Start recording with timeslice to ensure data is captured
      mediaRecorder.start(100); // Request data every 100ms
      console.log('MediaRecorder started, state:', mediaRecorder.state);
      setIsRecording(true);
      setCallState('listening');

      // Waveform visualization starts via useEffect when isRecording becomes true

      // Start duration timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingDuration(seconds);
      }, 1000);

    } catch (error) {
      console.error('Microphone access denied:', error);
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCallState('processing');

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-accent-tertiary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Phone Screen */}
        <div className="bg-accent-tertiary rounded-[3rem] p-6 shadow-2xl border-8 border-text-primary">
          {/* Status Bar */}
          <div className="font-body flex justify-between items-center mb-8 text-text-inverse text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-text-inverse rounded-sm"></div>
              <div className="w-4 h-3 bg-text-inverse rounded-sm opacity-70"></div>
              <div className="w-4 h-3 bg-text-inverse rounded-sm opacity-40"></div>
            </div>
            <div className="flex items-center gap-2">
              <span>100%</span>
              <svg className="w-6 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="1" y="6" width="18" height="12" rx="2" />
                <path d="M19 10v4" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Call Info */}
          <div className="text-center mb-12">
            {callState === 'ringing' && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cta-primary flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-on-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-text-inverse mb-2">Interview Coach Calling...</h2>
                <p className="font-body text-text-inverse/60">Question {questionNumber} of {totalQuestions}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <div className="w-3 h-3 bg-cta-primary rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-cta-primary rounded-full animate-pulse delay-75"></div>
                  <div className="w-3 h-3 bg-cta-primary rounded-full animate-pulse delay-150"></div>
                </div>
              </>
            )}

            {callState === 'connecting' && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-text-on-success" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-text-inverse mb-2">Connecting...</h2>
                <p className="font-body text-text-inverse/60">Setting up your practice session</p>
              </>
            )}

            {(callState === 'ready' || callState === 'listening') && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success flex items-center justify-center">
                  {isRecording ? (
                    <div className="w-6 h-6 bg-text-on-success rounded-full animate-pulse"></div>
                  ) : (
                    <svg className="w-12 h-12 text-text-on-success" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  )}
                </div>
                <h2 className="font-display text-xl font-bold text-text-inverse mb-2">Interview Coach</h2>
                <p className="font-body text-text-inverse/60 text-sm mb-4">Question {questionNumber} of {totalQuestions}</p>
                {isRecording ? (
                  <>
                    <div className="bg-cta-primary text-text-on-cta px-4 py-2 rounded-full inline-block mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-text-on-cta rounded-full animate-pulse"></div>
                        <span className="font-mono text-lg">{formatTime(recordingDuration)}</span>
                      </div>
                    </div>
                    <p className="font-body text-text-cta text-sm mb-4">Recording your answer...</p>
                    {/* Audio Waveform Visualization */}
                    <div className="mt-4 mb-4">
                      <canvas
                        ref={canvasRef}
                        width="640"
                        height="120"
                        className="w-full rounded-lg bg-text-primary border border-accent-secondary"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-body text-text-inverse/60 mb-4">Press record when ready</p>
                )}
              </>
            )}

            {callState === 'processing' && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cta-primary flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-on-cta animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-text-inverse mb-2">Processing Answer...</h2>
                <p className="font-body text-text-inverse/60 mb-2">Transcribing and analyzing your response</p>
                <p className="font-body text-text-inverse/40 text-sm">(This usually takes 10-15 seconds)</p>
              </>
            )}

            {callState === 'feedback' && transcript && feedback && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-on-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-text-inverse mb-2">Answer Received!</h2>
                <p className="font-body text-text-inverse/60 mb-4">Here's what you said:</p>
              </>
            )}

            {callState === 'error' && (
              <>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cta-primary flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-on-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-text-inverse mb-2">Something Went Wrong</h2>
                <p className="font-body text-text-inverse/60 mb-2">{error || 'Failed to process your answer.'}</p>
                <p className="font-body text-text-inverse/40 text-sm">You can try again or skip this question.</p>
              </>
            )}
          </div>

          {/* Feedback Display */}
          {callState === 'feedback' && transcript && feedback && (
            <div className="mb-8 max-h-96 overflow-y-auto">
              {/* Transcript */}
              <div className="bg-text-primary rounded-2xl p-6 mb-4">
                <h3 className="font-display text-sm font-bold text-accent-secondary mb-3">YOUR ANSWER (TRANSCRIBED)</h3>
                <p className="font-body text-text-inverse text-sm leading-relaxed italic">&quot;{transcript}&quot;</p>
              </div>

              {/* Feedback Summary */}
              <div className="bg-text-primary rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-sm font-bold text-success mb-2">COACH'S FEEDBACK</h3>

                {feedback.overallImpression && (
                  <p className="font-body text-text-inverse/75 text-sm leading-relaxed">{feedback.overallImpression}</p>
                )}

                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <p className="font-body text-success text-xs font-semibold mb-2">✓ STRENGTHS</p>
                    <ul className="space-y-1">
                      {feedback.strengths.slice(0, 2).map((strength: string, idx: number) => (
                        <li key={idx} className="font-body text-text-inverse/75 text-xs">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* STAR, condensed to a single row - this panel sits inside
                    the call UI and can't take the full four-card treatment. */}
                {feedback.starApplicable && feedback.star && (
                  <div>
                    <p className="font-body text-text-inverse/75 text-xs font-semibold mb-2">STRUCTURE</p>
                    <div className="flex gap-2">
                      {(['situation', 'task', 'action', 'result'] as const).map(key => {
                        const part = feedback.star?.[key];
                        if (!part) return null;
                        return (
                          <span
                            key={key}
                            className={`font-body text-xs px-2 py-1 rounded capitalize ${
                              part.present
                                ? 'bg-success/25 text-text-inverse'
                                : 'bg-cta-primary/30 text-text-inverse'
                            }`}
                          >
                            {part.present ? '✓' : '✕'} {key}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* `questions` is the current shape; `improvements` kept so
                    answers recorded before the Socratic rewrite still show. */}
                {(feedback.questions?.length > 0 || feedback.improvements?.length > 0) && (
                  <div>
                    <p className="font-body text-accent-secondary text-xs font-semibold mb-2">
                      {feedback.questions?.length > 0 ? '→ WORTH THINKING ABOUT' : '→ TO IMPROVE'}
                    </p>
                    <ul className="space-y-1">
                      {(feedback.questions ?? feedback.improvements)
                        .slice(0, 2)
                        .map((item: string, idx: number) => (
                          <li key={idx} className="font-body text-text-inverse/75 text-xs">• {item}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question Display */}
          {(callState === 'ready' || callState === 'listening') && (
            <div className="bg-text-primary rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-cta-primary flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-text-on-cta font-bold">{questionNumber}</span>
                </div>
                <div className="flex-1">
                  <p className="font-body text-text-inverse text-lg leading-relaxed">{question}</p>
                </div>
              </div>
              {!isRecording && (
                <p className="font-body text-text-inverse/60 text-sm mt-4">
                  Tap the microphone button when you're ready to answer
                </p>
              )}
            </div>
          )}

          {/* Call Controls */}
          {permissionDenied ? (
            <div className="text-center">
              <p className="font-body text-text-cta mb-4">Microphone access denied</p>
              <p className="font-body text-text-inverse/60 text-sm mb-6">
                Please enable microphone permissions in your browser settings
              </p>
              <button
                onClick={onSkip}
                className="font-body bg-text-primary text-text-inverse px-8 py-4 rounded-full font-semibold"
              >
                Skip This Question
              </button>
            </div>
          ) : (
            <div className="flex justify-center gap-8">
              {callState === 'ready' && !isRecording && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex gap-6">
                    {/* Record Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={startRecording}
                        className="w-20 h-20 rounded-full bg-cta-primary flex items-center justify-center shadow-lg hover:opacity-90 transition transform hover:scale-105"
                      >
                        <svg className="w-10 h-10 text-text-on-cta" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </button>
                      <span className="font-body text-text-inverse text-sm font-medium">Record</span>
                    </div>

                    {/* Skip Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={onSkip}
                        className="w-20 h-20 rounded-full bg-text-primary border border-text-inverse/20 flex items-center justify-center shadow-lg hover:opacity-90 transition"
                      >
                        <svg className="w-8 h-8 text-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="font-body text-text-inverse/60 text-sm font-medium">Skip</span>
                    </div>
                  </div>
                  {questionNumber < totalQuestions && (
                    <p className="font-body text-text-inverse/40 text-xs mt-2">
                      Next: Question {questionNumber + 1}
                    </p>
                  )}
                </div>
              )}

              {callState === 'listening' && isRecording && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Stop & Submit Button */}
                  <button
                    onClick={stopRecording}
                    className="font-body w-full px-8 py-4 bg-cta-primary text-text-on-cta rounded-full font-bold hover:opacity-90 transition shadow-lg"
                  >
                    Stop & Submit Answer
                  </button>
                  <p className="font-body text-text-inverse/40 text-xs">Your answer will be transcribed and analyzed</p>
                </div>
              )}

              {callState === 'processing' && (
                <>
                  <button
                    onClick={onHangUp}
                    className="font-body w-full px-8 py-4 bg-text-primary text-text-inverse border border-text-inverse/20 rounded-full font-semibold hover:opacity-90 transition"
                  >
                    Back to Questions
                  </button>
                </>
              )}

              {callState === 'feedback' && onContinue && (
                <>
                  <button
                    onClick={onContinue}
                    className="font-body w-full px-8 py-4 bg-success text-text-on-success rounded-full text-lg font-semibold hover:opacity-90 transition shadow-lg mb-4"
                  >
                    {questionNumber < totalQuestions ? 'Next Question →' : 'Finish Session'}
                  </button>
                  <button
                    onClick={onHangUp}
                    className="font-body w-full px-8 py-3 bg-text-primary text-text-inverse border border-text-inverse/20 rounded-full font-semibold hover:opacity-90 transition"
                  >
                    End Session & Review
                  </button>
                </>
              )}

              {callState === 'error' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="font-body w-full px-8 py-4 bg-cta-primary text-text-on-cta rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={onSkip}
                    className="font-body w-full px-8 py-3 bg-text-primary text-text-inverse border border-text-inverse/20 rounded-full font-semibold hover:opacity-90 transition"
                  >
                    Skip This Question
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hang Up Button - Always Available (except during processing) */}
          {callState !== 'processing' && callState !== 'ringing' && callState !== 'connecting' && (
            <div className="mt-6 text-center">
              <button
                onClick={onHangUp}
                className="font-body text-text-inverse/60 hover:text-text-inverse text-sm transition"
              >
                {callState === 'feedback' ? '' : 'End Session Early'}
              </button>
            </div>
          )}

          {/* Home Indicator (iPhone style) */}
          <div className="mt-8 flex justify-center">
            <div className="w-32 h-1 bg-text-inverse/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
