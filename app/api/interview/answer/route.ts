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

// Guards against Vercel's default function timeout silently killing the
// request before Claude responds, with no error logged.
export const maxDuration = 60;

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

    // Role context is looked up server-side from the session's linked CV
    // rather than accepted from the client - the client has no business
    // asserting which role it's being graded against, and this also keeps
    // job descriptions out of the request payload on every answer.
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

    // Get AI feedback on the answer
    const feedbackMessage = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry interview coach. Critique this interview answer so the candidate can improve it themselves.

Question: ${question}
${question_category ? `Category: ${question_category}` : ''}
${roleContext}

Candidate's Answer:
${written_answer}

COACHING PRINCIPLES - these override any instinct to be helpful by writing for them:
1. **Never rewrite their answer.** Do not supply a improved version, a model answer, or a sentence they could repeat back. Where something is missing, name what's missing and ask the question that would help them find it in their own experience.
2. **Never use AI-tell language**: avoid "spearheaded," "leveraged," "utilized," "dynamic," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," or stacking em-dashes.
3. **Be specific to what they actually wrote.** Quote or reference their real words. Generic feedback that could apply to any answer is worthless.
4. **Be honest.** Don't inflate. An answer that genuinely doesn't work should be told so, kindly and with a route forward.

STAR STRUCTURE:
STAR (Situation, Task, Action, Result) applies to behavioural questions - "tell me about a time when...". It does NOT sensibly apply to motivational or opinion questions ("why do you want to work in film?"), and forcing it there is bad advice. Set "starApplicable" to false for those, and leave the star object's fields as false with empty notes.

Where it does apply, judge each component independently and honestly. A missing Result is the single most common failure - people describe what they did but never say how it turned out.

CLARITY RATING:
Rate how clearly this answer would land with an interviewer, 1-5:
1 = hard to follow, 2 = gets there eventually, 3 = clear enough, 4 = clear and easy to follow, 5 = genuinely compelling.
Judge the answer as written, not the person's potential.

Provide feedback in this JSON structure:
{
  "assessedClarity": number (1-5),
  "clarityNote": "one sentence on why it landed at that number",
  "starApplicable": boolean,
  "star": {
    "situation": { "present": boolean, "note": "short - what they gave, or what's missing" },
    "task": { "present": boolean, "note": "short" },
    "action": { "present": boolean, "note": "short" },
    "result": { "present": boolean, "note": "short" }
  },
  "strengths": ["specific to what they wrote"],
  "questions": ["guiding questions that help them strengthen it themselves - never instructions to follow"],
  "overallImpression": "2-3 sentences, honest"
}

Return ONLY the JSON object, no markdown formatting.`
        }
      ]
    });

    if (feedbackMessage.stop_reason === 'max_tokens') {
      // Truncated mid-JSON, so the parse below will fail into the raw-text
      // fallback. Log it so a recurring ceiling problem is visible rather
      // than looking like intermittently malformed feedback.
      console.error('Interview feedback truncated: hit max_tokens before finishing', {
        practiceSessionId: practice_session_id,
        model,
        usage: feedbackMessage.usage
      });
    }

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
