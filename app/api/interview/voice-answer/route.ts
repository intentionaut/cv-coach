import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import Anthropic from '@anthropic-ai/sdk';
import { DeepgramClient } from '@deepgram/sdk';
import { getUserTier } from '@/lib/auth';
import { getModelForTier } from '@/lib/tier';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });

// Guards against Vercel's default function timeout silently killing the
// request before transcription + Claude finish, with no error logged.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const practice_session_id = formData.get('practice_session_id') as string;
    const question_id = formData.get('question_id') as string;
    const question = formData.get('question') as string;
    const question_category = formData.get('question_category') as string;
    const question_difficulty = formData.get('question_difficulty') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Same role context the written route gets, looked up server-side from
    // the session's linked CV rather than trusted from the client.
    const contextResult = await db.query(
      `SELECT cd.job_title, cd.job_description, cd.summary
       FROM interview_practice_sessions ips
       LEFT JOIN cv_data cd ON ips.cv_id = cd.id
       WHERE ips.id = $1 AND ips.user_id = $2`,
      [practice_session_id, session.user.id]
    );
    if (contextResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const ctx = contextResult.rows[0];
    const roleContext = ctx?.job_title
      ? `\nThis candidate is preparing specifically for: ${ctx.job_title}${
          ctx.job_description ? `\n\nThe role's description:\n${ctx.job_description}` : ''
        }${
          ctx.summary ? `\n\nTheir CV summary, for context on what they can draw on:\n${ctx.summary}` : ''
        }\n\nWhere it's genuinely relevant, connect your feedback to what this specific role needs - but don't force it if the answer stands on its own.\n`
      : '';

    console.log('Transcribing audio with Deepgram...');
    console.log('Audio file size:', audioFile.size, 'bytes, type:', audioFile.type);

    // Step 1: Transcribe audio using Deepgram
    const audioBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    console.log('Buffer size:', buffer.length, 'bytes');

    const response = await deepgram.listen.v1.media.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        diarize: false,
      }
    );

    console.log('Full Deepgram response:', JSON.stringify(response, null, 2));

    if (!('results' in response)) {
      // Only happens if a `callback` param is set, which we don't use here —
      // Deepgram would return { request_id } instead of the transcript synchronously.
      return NextResponse.json(
        { error: 'Failed to process voice answer', details: 'Deepgram returned an async-accepted response instead of a transcript' },
        { status: 502 }
      );
    }

    const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('Transcript:', transcript);
    console.log('Deepgram response metadata:', JSON.stringify(response.metadata, null, 2));

    // Step 2: Get AI feedback on the transcribed answer using Claude
    const feedbackMessage = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      tools: [{
        name: 'submit_feedback',
        description: 'Submit structured interview feedback for the candidate\'s answer',
        input_schema: {
          type: 'object',
          properties: {
            assessedClarity: {
              type: 'number',
              description: 'How clearly this answer would land with an interviewer, 1-5'
            },
            clarityNote: { type: 'string', description: 'One sentence on why it landed at that number' },
            starApplicable: {
              type: 'boolean',
              description: 'False for motivational or opinion questions, where STAR does not sensibly apply'
            },
            star: {
              type: 'object',
              properties: {
                situation: {
                  type: 'object',
                  properties: { present: { type: 'boolean' }, note: { type: 'string' } },
                  required: ['present', 'note']
                },
                task: {
                  type: 'object',
                  properties: { present: { type: 'boolean' }, note: { type: 'string' } },
                  required: ['present', 'note']
                },
                action: {
                  type: 'object',
                  properties: { present: { type: 'boolean' }, note: { type: 'string' } },
                  required: ['present', 'note']
                },
                result: {
                  type: 'object',
                  properties: { present: { type: 'boolean' }, note: { type: 'string' } },
                  required: ['present', 'note']
                }
              },
              required: ['situation', 'task', 'action', 'result']
            },
            strengths: { type: 'array', items: { type: 'string' } },
            questions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Guiding questions that help them improve it themselves - never instructions'
            },
            overallImpression: { type: 'string' },
            voiceQualityNotes: { type: 'string' }
          },
          required: [
            'assessedClarity',
            'clarityNote',
            'starApplicable',
            'star',
            'strengths',
            'questions',
            'overallImpression',
            'voiceQualityNotes'
          ]
        }
      }],
      tool_choice: { type: 'tool', name: 'submit_feedback' },
      messages: [{
        role: 'user',
        content: `You are an expert film and theatre industry interview coach. Critique this spoken interview answer so the candidate can improve it themselves.

Question: ${question}
Category: ${question_category}
${roleContext}

Candidate's Answer (transcribed from voice):
${transcript}

COACHING PRINCIPLES - these override any instinct to be helpful by writing for them:
1. **Never rewrite their answer.** Do not supply an improved version, a model answer, or a sentence they could repeat back. Where something is missing, name what's missing and ask the question that would help them find it in their own experience.
2. **Never use AI-tell language**: avoid "spearheaded," "leveraged," "utilized," "dynamic," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," or stacking em-dashes.
3. **Be specific to what they actually said.** Reference their real words. Generic feedback that could apply to any answer is worthless.
4. **Be honest.** Don't inflate. An answer that genuinely doesn't work should be told so, kindly and with a route forward.

STAR STRUCTURE:
STAR (Situation, Task, Action, Result) applies to behavioural questions - "tell me about a time when...". It does NOT sensibly apply to motivational or opinion questions ("why do you want to work in film?"), and forcing it there is bad advice. Set starApplicable to false for those, with the star fields false and empty notes. Where it does apply, judge each component independently. A missing Result is the most common failure.

CLARITY RATING (assessedClarity, 1-5):
1 = hard to follow, 2 = gets there eventually, 3 = clear enough, 4 = clear and easy to follow, 5 = genuinely compelling. Judge the answer as given, not the person's potential.

VOICE NOTES:
This was spoken, so a transcript carries real signal a written answer doesn't - filler words, false starts, rambling, sentences that never resolve. Use voiceQualityNotes for what delivery you can genuinely infer from the transcript, and be honest that tone and pace aren't visible in text.

Call submit_feedback with your analysis.`
      }]
    });

    const toolUseBlock = feedbackMessage.content.find(
      (block): block is Extract<typeof block, { type: 'tool_use' }> => block.type === 'tool_use'
    );

    if (!toolUseBlock) {
      console.error('Claude did not return a tool_use block:', JSON.stringify(feedbackMessage.content, null, 2));
      return NextResponse.json(
        { error: 'Failed to process voice answer', details: 'AI feedback generation did not return structured output' },
        { status: 502 }
      );
    }

    const aiFeedback = toolUseBlock.input as {
      assessedClarity: number;
      clarityNote: string;
      starApplicable: boolean;
      star: Record<string, { present: boolean; note: string }>;
      strengths: string[];
      questions: string[];
      overallImpression: string;
      voiceQualityNotes: string;
    };

    // Step 3: Store transcript as written_answer
    // In a future iteration, we could add audio_url column to store in blob storage
    const dbResult = await db.query(
      `INSERT INTO interview_sessions (
        user_id, practice_session_id, role_id, question,
        question_category, question_difficulty,
        written_answer, ai_feedback, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        session.user.id,
        practice_session_id,
        null, // role_id
        question,
        question_category,
        question_difficulty,
        transcript, // Store transcript as written_answer
        JSON.stringify(aiFeedback)
      ]
    );

    return NextResponse.json({
      success: true,
      responseId: dbResult.rows[0]?.id,
      transcript,
      feedback: aiFeedback
    });

  } catch (error: any) {
    console.error('Voice answer processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice answer', details: error.message },
      { status: 500 }
    );
  }
}
