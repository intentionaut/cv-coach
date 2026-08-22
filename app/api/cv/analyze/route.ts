import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db/client';
import { FILM_THEATRE_SKILLS } from '@/lib/data/film-skills';
import { getUserTier } from '@/lib/auth';
import { logUsage } from '@/lib/ai/usage';
import { getModelForTier } from '@/lib/tier';
import { redactContact } from '@/lib/privacy';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// CV analysis can take well over Vercel's default function timeout - Claude
// generates up to 12000 tokens here. Without this, the platform kills the
// function before it finishes, with no error logged and the UI just hangs.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const { cvData, jobTitle, jobDescription, cvId } = await req.json();

    if (!cvData) {
      return NextResponse.json({ error: 'No CV data provided' }, { status: 400 });
    }

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    const owns = await db.query(`SELECT id FROM cv_data WHERE id = $1 AND user_id = $2`, [
      cvId,
      session.user.id
    ]);
    if (owns.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    // Get all available film/theatre skills for context
    const availableSkills = FILM_THEATRE_SKILLS;

    // Use Claude to analyze the CV and provide improvement suggestions
    const claudeStream = anthropic.messages.stream({
      model,
      max_tokens: 12000,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry career coach. Your job is not to rewrite this person's CV for them - it's to help them think through their own experience and learn to represent it well, so they leave this session better at self-advocacy, not just holding a better document.

Target Role: ${jobTitle || 'No specific role given - assess generally against the film and theatre industry, covering a broad range of entry-level production, technical, and administrative roles.'}
${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}

Current CV Data:
${JSON.stringify(redactContact(cvData), null, 2)}

Available Film/Theatre Industry Skills for Reference:
${JSON.stringify(availableSkills, null, 2)}

NOTE ON CONTACT DETAILS: the CV's contact block is deliberately withheld. You get only "contactPresence" booleans, which is enough to tell them what is missing. You never need the values, so don't ask for them or quote them back.

IMPORTANT: First identify any MISSING essential information (email, phone, location, professional summary) and include tasks to add these in your recommendations.

COACHING PRINCIPLES - apply these throughout every field below:

1. **Score for voice as well as ATS.** Don't just reward keyword coverage and standard formatting. A CV that's parseable but reads like generic boilerplate should score lower on summary/experience than one that's a little rougher but sounds like an actual specific person with real motivations. When you critique, name both dimensions - is this legible to a scanner AND does it sound like someone wrote it?

2. **Never write in AI-tell language, and flag it when the candidate has.** Avoid words/patterns like "spearheaded," "leveraged," "utilized," "dynamic," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," or stacking em-dashes for emphasis - in anything you write. If the CV already contains this kind of generic corporate-bot phrasing, call it out as something to soften into their own words, not just something to keep.

3. **Coach with questions, not finished answers.** For "improvements" text and "priorityImprovements[].change", point at what's vague, missing, or generic and ask the specific question that would help them fill it in - don't hand over a drop-in replacement sentence. Bad: "Change 'helped with lighting' to 'Assisted the gaffer in rigging and operating lighting equipment for a 15-person crew.'" Good: "This line says 'helped with lighting' but not what you actually did - were you rigging, operating, or assisting the gaffer directly? Do you remember the crew size or how many shoot days?" The candidate should leave knowing how to think about their own experience, not just what string to paste in.

4. **Any illustrative example must come from an adjacent, different scenario - never their literal answer.** When you demonstrate a technique (in languageUpgrades.example or quantificationPrompts.exampleAnswers), invent a short example from a different specific role or production than the one in this CV or target role - close enough to be useful as a pattern, different enough that it cannot be copy-pasted into their CV as-is. This is a hard constraint, not a suggestion.

Please analyze the CV and provide:

1. **Overall Score** (0-100): Weigh both ATS-parseability and authentic personal voice
2. **Confidence Boosters**: Identify 3-5 strong points the candidate should feel proud of - genuine, specific to their actual experience
3. **Section-by-Section Analysis**:
   - Summary/Objective: Score (0-100) and specific improvements, framed per the coaching principles above
   - Experience: Score (0-100) and specific improvements for each role, framed per the coaching principles above
   - Skills: Score (0-100), missing industry-relevant skills, suggestions for better presentation
   - Education: Score (0-100) and how to better highlight relevant coursework/projects
   - Projects: Score (0-100) and suggestions for better storytelling

4. **Priority Improvements**: Top 3-5 changes that will have the biggest impact (MUST include any missing essential contact info or summary as high priority tasks) - phrased as guiding questions per principle 3
5. **Achievement Quantification Prompts**: For each, a question to help them recall a measurable detail (e.g. "What was the budget?" "How many crew members?"), PLUS 2-3 short exampleAnswers showing how such an answer might read, drawn from an adjacent production context per principle 4 - never their literal number, just enough to spark how to phrase it
6. **Missing Skills**: Industry-relevant skills they should consider adding (from the skills database)
7. **Formatting & Presentation**: Specific suggestions for visual improvements
8. **Language & Voice Coaching**: For notably weak or generic lines, quote the real line (current), name the underlying technique in one sentence (principle), and demonstrate it with an adjacent-scenario example (example) per principle 4 - plus a short reason grounded in sounding human, not just "stronger"

9. **Role fit** (ONLY when a job description was given above - otherwise return roleFit as null): where this CV already lines up with the posting, and where it doesn't. Every gap must carry the question that would help them work out whether they actually have that thing. Distinguish "they haven't evidenced this" from "they can't do this" - early-career candidates routinely have relevant experience they simply didn't think to write down, and the question should help them dig it out.

CRITICAL - THE SCORE IS A SINGLE NUMBER:
There is exactly one score: overallScore. When a job description is given, that score reflects **how ready this CV is for that specific role** - CV quality and role fit together, not two separate judgements. When no job description is given, it reflects CV quality against general film and theatre industry standards. Never produce a separate fit score. Make sure the section scores, roleFit content, and overallScore all tell a consistent story - they must not contradict each other.

Be honest with the number. A lower score for a genuine step-up role is useful information, not a failure, and scoreRationale should say so plainly. Equally, don't manufacture problems to seem rigorous.

Return a JSON object with EXACTLY these keys in EXACTLY this order (the order matters - the interface reveals them progressively as they arrive):
{
  "overallScore": number,
  "scoreRationale": "one honest sentence on what that number reflects and what it doesn't",
  "confidenceBoosters": ["string"],
  "priorityImprovements": [
    { "priority": number, "section": "string", "change": "string", "impact": "string" }
  ],
  "roleFit": {
    "strongOverlap": [ { "requirement": "string", "evidence": "string" } ],
    "gaps": [ { "requirement": "string", "missing": "string", "question": "string" } ],
    "notEvidenced": ["string"]
  },
  "sections": {
    "summary": { "score": number, "improvements": ["string"] },
    "experience": { "score": number, "improvements": ["string"] },
    "skills": { "score": number, "improvements": ["string"], "missingSkills": ["string"] },
    "education": { "score": number, "improvements": ["string"] },
    "projects": { "score": number, "improvements": ["string"] }
  },
  "quantificationPrompts": [
    { "section": "string", "item": "string", "questions": ["string"], "exampleAnswers": ["string"] }
  ],
  "languageUpgrades": [
    { "current": "string", "principle": "string", "example": "string", "reason": "string" }
  ],
  "formattingTips": ["string"]
}

Return ONLY the JSON object, no additional text.`
        }
      ]
    });

    // title is VARCHAR(255) - jobDescription can be a full pasted job
    // posting, so it has to be truncated or a long one blows the column and
    // the whole insert fails after Claude has already run (and been paid
    // for). Prefer the short jobTitle when there is one.
    const titleRole = (jobTitle || jobDescription || 'Film/Theatre').replace(/\s+/g, ' ').trim().slice(0, 200);

    // Streamed rather than awaited whole: the analysis takes tens of seconds
    // to generate, and the schema is ordered so the score and headline
    // guidance arrive first. The client parses the partial JSON as it lands
    // (see lib/partial-json.ts) and reveals each field the moment it
    // completes, instead of showing a spinner for the full duration.
    const encoder = new TextEncoder();
    const userId = session.user.id;

    const readable = new ReadableStream({
      async start(controller) {
        let full = '';
        try {
          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              full += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const finalMessage = await claudeStream.finalMessage();

          // The single most expensive call in the app, and the only one a
          // user can repeat without limit on paid tiers - so this is the row
          // that decides cost per CV.
          logUsage({
            userId,
            surface: 'cv_analysis',
            model,
            usage: finalMessage.usage,
            tier,
            succeeded: finalMessage.stop_reason !== 'max_tokens'
          });

          if (finalMessage.stop_reason === 'max_tokens') {
            // The JSON is cut off mid-structure. The client will simply never
            // see the trailing fields; log it so a recurring ceiling problem
            // is visible rather than looking like flaky output.
            console.error('CV analysis truncated: hit max_tokens before finishing', {
              cvId,
              model,
              usage: finalMessage.usage
            });
          }

          // Persist so a returning user's session rebuilds from the database
          // without paying for another Claude call.
          let jsonText = full.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
          }
          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          }

          try {
            const analysis = JSON.parse(jsonText);
            await db.query(
              `INSERT INTO coaching_recommendations (
                user_id, cv_id, type, priority, title, description, action_items, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                userId,
                cvId,
                'cv_analysis',
                'high',
                `CV Analysis for ${titleRole}`,
                `Overall Score: ${analysis.overallScore}/100`,
                JSON.stringify(analysis)
              ]
            );
          } catch (persistError: any) {
            // The user already has the streamed content on screen, so this
            // isn't fatal to their session - but it means the analysis won't
            // survive a reload, which is worth seeing in the logs.
            console.error('CV analysis persist failed:', {
              cvId,
              model,
              message: persistError?.message,
              responseLength: jsonText.length,
              responseStart: jsonText.slice(0, 500),
              responseEnd: jsonText.slice(-500)
            });
          }
        } catch (streamError: any) {
          console.error('CV analysis stream error:', {
            cvId,
            model,
            message: streamError?.message,
            name: streamError?.name,
            status: streamError?.status,
            anthropicError: streamError?.error
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        // Streaming is the whole point here - make sure nothing downstream
        // decides to helpfully buffer the response before it reaches us.
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error: any) {
    // A plain `console.error(label, error)` on an Anthropic SDK error prints
    // a generic "Error: 400 {...}" - the actually useful part (rate limit vs
    // invalid request vs overloaded, which field was rejected) is nested in
    // error.error/.status and gets buried or truncated in the log viewer.
    // Pulling those fields to the top makes the real cause visible at a glance.
    console.error('CV analysis error:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      anthropicError: error?.error,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to analyze CV', details: error.message },
      { status: 500 }
    );
  }
}
