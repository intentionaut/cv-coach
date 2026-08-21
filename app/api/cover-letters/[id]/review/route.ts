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

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const { id } = await params;
    const { content } = await req.json();

    const letterResult = await db.query(
      `SELECT cl.company_name, cl.job_title, cl.job_description, cd.summary
       FROM cover_letters cl
       JOIN cv_data cd ON cd.id = cl.cv_id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [id, session.user.id]
    );
    if (letterResult.rows.length === 0) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }
    const letter = letterResult.rows[0];
    const textToReview = typeof content === 'string' && content.trim() ? content : null;
    if (!textToReview) {
      return NextResponse.json({ error: 'No letter content to review' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry career coach reviewing a cover letter draft. Your job is to help the writer see what's working and what's still vague or generic - not to rewrite it for them.

COACHING PRINCIPLES:
1. Point at what's vague, generic, or sounds like AI-tell language ("spearheaded," "leveraged," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," stacked em-dashes) and ask a question that would help them fix it themselves - never hand over a replacement sentence.
2. Also name what's genuinely working - specific, human, well-connected to the role.
3. Check whether it actually connects their real experience to this specific role/company, not just their CV in paragraph form.

Applying to: ${letter.company_name ? `${letter.company_name} - ` : ''}${letter.job_title}
${letter.job_description ? `\nJob Description:\n${letter.job_description}` : ''}

CV summary for context: ${letter.summary || 'Not provided'}

Draft to review:
${textToReview}

Return a JSON object with this structure:
{
  "strengths": ["string - specific things that are already working"],
  "questions": ["string - guiding questions about what's vague or generic, not rewritten sentences"]
}

Return ONLY the JSON object, no additional text.`
        }
      ]
    });

    if (message.stop_reason === 'max_tokens') {
      console.error('Cover letter review truncated', { letterId: id, model, usage: message.usage });
      return NextResponse.json(
        { error: 'Feedback was too long to complete in one pass. Try again.' },
        { status: 502 }
      );
    }

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
    }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    let feedback;
    try {
      feedback = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('Cover letter review JSON parse failed:', {
        letterId: id,
        model,
        parseErrorMessage: parseError.message,
        responseStart: jsonText.slice(0, 500)
      });
      throw parseError;
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error('Cover letter review error:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      anthropicError: error?.error,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to review cover letter', details: error.message },
      { status: 500 }
    );
  }
}
