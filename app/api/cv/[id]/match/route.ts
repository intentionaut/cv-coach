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

// Claude call, so it needs the same timeout guard as the other AI routes -
// without it Vercel kills the function before Claude responds, with no
// error logged and the UI just hanging.
export const maxDuration = 60;

// Replaces the orphaned /api/coaching/tailor-cv, which computed a match
// score but was never reachable from any UI. Two substantive changes beyond
// wiring it up: it reads the job description from the CV itself (so the role
// is the spine rather than something passed around), and it no longer writes
// a "tailored summary" for the user - that handed over finished prose, which
// is exactly what the CV coaching prompt was rewritten to stop doing.
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

    const result = await db.query(
      `SELECT name, summary, experience, education, skills, projects,
              job_title, job_description
       FROM cv_data WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }
    const cv = result.rows[0];

    if (!cv.job_description?.trim()) {
      return NextResponse.json(
        { error: 'Add the job description for this role first, so there is something to compare against.' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry career coach. Compare this candidate's CV against a specific job posting and show them where they already line up and where the gaps are.

COACHING PRINCIPLES - these override any instinct to be encouraging or comprehensive:
1. **Never write their CV for them.** Do not produce a rewritten summary, a suggested bullet, or finished prose they could paste in. For each gap, name what's missing and ask the question that would help them find their own answer.
2. **Never use AI-tell language**: avoid "spearheaded," "leveraged," "utilized," "dynamic," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," or stacking em-dashes.
3. **Be honest about the score.** A lower score for a genuine step-up role is useful information, not a failure - say so plainly rather than inflating it. Equally, don't manufacture gaps to seem rigorous.
4. **Distinguish "they haven't evidenced this" from "they can't do this."** Early-career candidates routinely have relevant experience they simply didn't think to write down. Where that's plausible, the gap is about evidence, not ability - and the question should help them dig it out.

The role:
${cv.job_title ? `Job title: ${cv.job_title}\n` : ''}
Job description:
${cv.job_description}

Their CV:
Summary: ${cv.summary || 'Not provided'}
Experience: ${JSON.stringify(cv.experience || [])}
Education: ${JSON.stringify(cv.education || [])}
Skills: ${(cv.skills || []).join(', ') || 'None listed'}
Projects: ${JSON.stringify(cv.projects || [])}

Return a JSON object with this structure:
{
  "matchScore": number (0-100),
  "scoreRationale": "one honest sentence on what that number reflects, and what it doesn't",
  "strongOverlap": [
    { "requirement": "what the posting asks for", "evidence": "the specific thing in their CV that already answers it" }
  ],
  "gaps": [
    { "requirement": "what the posting asks for", "missing": "what their CV doesn't currently show", "question": "the question that would help them work out whether they actually have this and how to say it" }
  ],
  "notEvidenced": ["short strings - things the posting wants that the CV is completely silent on"]
}

Return ONLY the JSON object, no additional text.`
        }
      ]
    });

    if (message.stop_reason === 'max_tokens') {
      console.error('CV match truncated: hit max_tokens before finishing', {
        cvId: id,
        model,
        usage: message.usage
      });
      return NextResponse.json(
        { error: 'That comparison was too long to finish in one pass. Try again.' },
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

    let match;
    try {
      match = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('CV match JSON parse failed:', {
        cvId: id,
        model,
        parseErrorMessage: parseError.message,
        responseLength: jsonText.length,
        responseStart: jsonText.slice(0, 500),
        responseEnd: jsonText.slice(-500)
      });
      throw parseError;
    }

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error('CV match error:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      anthropicError: error?.error,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to compare your CV to this role', details: error.message },
      { status: 500 }
    );
  }
}
