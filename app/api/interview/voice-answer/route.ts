import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import Anthropic from '@anthropic-ai/sdk';
import { DeepgramClient } from '@deepgram/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      tools: [{
        name: 'submit_feedback',
        description: 'Submit structured interview feedback for the candidate\'s answer',
        input_schema: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            overallImpression: { type: 'string' },
            suggestedRevision: { type: 'string' },
            voiceQualityNotes: { type: 'string' }
          },
          required: ['strengths', 'improvements', 'overallImpression', 'suggestedRevision', 'voiceQualityNotes']
        }
      }],
      tool_choice: { type: 'tool', name: 'submit_feedback' },
      messages: [{
        role: 'user',
        content: `You are an expert film industry interview coach. Analyze this interview answer and provide constructive feedback.

Question: ${question}
Category: ${question_category}

Candidate's Answer (transcribed from voice):
${transcript}

Call submit_feedback with your analysis. For voiceQualityNotes, give brief notes on what you can infer about delivery from the transcript.`
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
      strengths: string[];
      improvements: string[];
      overallImpression: string;
      suggestedRevision: string;
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
