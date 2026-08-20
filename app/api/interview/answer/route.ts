import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db/client';
import { getUserTier } from '@/lib/auth';
import { getModelForTier } from '@/lib/tier';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// POST: Submit answer for a question
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const {
      practice_session_id,
      question_id,
      question,
      question_category,
      question_difficulty,
      written_answer,
      confidence_score,
      clarity_score,
      role_id
    } = await req.json();

    if (!practice_session_id || !question || !written_answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get AI feedback on the answer
    const feedbackMessage = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an expert film industry interview coach. Analyze this interview answer and provide constructive feedback.

Question: ${question}
${question_category ? `Category: ${question_category}` : ''}

Candidate's Answer:
${written_answer}

Provide feedback in this JSON structure:
{
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific suggestion 1", "specific suggestion 2"],
  "overallImpression": "brief overall assessment (2-3 sentences)",
  "suggestedRevision": "optional: a brief example of how to strengthen weak parts"
}

Focus on:
- Clarity and structure (STAR method for behavioral questions)
- Relevance to film industry
- Specific examples and details
- Professional tone

Return ONLY the JSON object, no markdown formatting.`
        }
      ]
    });

    const textContent = feedbackMessage.content.find(block => block.type === 'text');
    let aiFeedback = null;

    if (textContent && textContent.type === 'text') {
      try {
        let jsonText = textContent.text.trim();
        // Remove markdown code fences if present
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
        }
        aiFeedback = JSON.parse(jsonText);
      } catch (e) {
        console.error('Failed to parse AI feedback:', e);
        aiFeedback = { overallImpression: textContent.text };
      }
    }

    // Store the answer
    const result = await db.query(
      `INSERT INTO interview_sessions (
        user_id, practice_session_id, role_id, question_id, question,
        question_category, question_difficulty,
        written_answer, confidence_score, clarity_score,
        ai_feedback, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id`,
      [
        session.user.id,
        practice_session_id,
        role_id || null,
        question_id || null,
        question,
        question_category || null,
        question_difficulty || null,
        written_answer,
        confidence_score || null,
        clarity_score || null,
        JSON.stringify(aiFeedback)
      ]
    );

    return NextResponse.json({
      success: true,
      answerId: result.rows[0].id,
      feedback: aiFeedback
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer', details: error.message },
      { status: 500 }
    );
  }
}
