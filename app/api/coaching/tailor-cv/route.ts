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

    const { cvData, jobDescription, jobRequirements } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI coaching not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a career coach specializing in the film industry. A film student needs help tailoring their CV for a specific role.

Job Description:
${jobDescription}

Job Requirements:
${jobRequirements.join('\n')}

Current CV Summary:
${cvData.summary || 'Not provided'}

Experience:
${JSON.stringify(cvData.experience, null, 2)}

Skills:
${JSON.stringify(cvData.skills, null, 2)}

Projects:
${JSON.stringify(cvData.projects, null, 2)}

Please provide:
1. A tailored summary (2-3 sentences) that highlights relevant experience for this role
2. Which experience items to emphasize (list their IDs or titles)
3. Which skills to highlight (list skill names)
4. A match score (0-100) indicating how well their background fits
5. 3-5 specific suggestions for improving their application

Return as JSON with keys: tailoredSummary, highlightedExperience, highlightedSkills, matchScore, suggestions`;

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
    console.error('CV tailoring error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CV tailoring suggestions' },
      { status: 500 }
    );
  }
}
