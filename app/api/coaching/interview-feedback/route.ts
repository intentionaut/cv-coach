import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import { getUserTier } from '@/lib/auth';
import { getModelForTier } from '@/lib/tier';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const { question, answer, scoringCriteria } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI coaching not configured' },
        { status: 500 }
      );
    }

    const criteriaText = scoringCriteria
      .map((c: any) => `- ${c.criterion} (weight: ${c.weight}): ${c.description}`)
      .join('\n');

    const prompt = `You are an interview coach specializing in the film industry. A film student just practiced answering an interview question.

Question:
${question}

Their Answer:
${answer}

Scoring Criteria:
${criteriaText}

Please provide detailed feedback in JSON format with:
1. overallScore: 0-100 score for the overall answer quality
2. strengths: Array of 2-3 things they did well
3. improvements: Array of 2-3 specific ways to improve
4. criteriaScores: Object mapping each criterion to {score: 0-100, feedback: string}
5. suggestedRevision: (optional) A brief example of how they could rephrase part of their answer

Be encouraging but honest. Focus on actionable feedback that helps them improve for real film industry interviews.`;

    const message = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse AI response
    const aiResponse = JSON.parse(content.text);

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Interview feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview feedback' },
      { status: 500 }
    );
  }
}
