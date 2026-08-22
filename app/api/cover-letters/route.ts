import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db/client';
import { getUserTier } from '@/lib/auth';
import { getModelForTier } from '@/lib/tier';
import { REUSABLE_QUESTION_KEYS } from '@/lib/data/cover-letter-questions';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Status now lives on the application, not the letter. COALESCE covers
    // any letter written before 014 backfilled one; 015 drops the old column.
    const result = await db.query(
      `SELECT cl.id, cl.company_name, cl.job_title, cl.updated_at, cl.application_id,
              COALESCE(a.status, cl.status) AS status,
              cd.name AS cv_name
       FROM cover_letters cl
       JOIN cv_data cd ON cd.id = cl.cv_id
       LEFT JOIN applications a ON a.id = cl.application_id
       WHERE cl.user_id = $1
       ORDER BY cl.created_at ASC`,
      [session.user.id]
    );

    return NextResponse.json({
      letters: result.rows.map((row: any) => ({
        id: row.id,
        applicationId: row.application_id,
        companyName: row.company_name || '',
        jobTitle: row.job_title,
        status: row.status,
        cvName: row.cv_name,
        updatedAt: row.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Cover letter list error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch cover letters', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const model = getModelForTier(tier);

    const { cvId, companyName, jobTitle, jobDescription, answers, applicationId } =
      await req.json();

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }
    if (!jobTitle || !jobTitle.trim()) {
      return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 });
    }

    const cvResult = await db.query(
      `SELECT name, personal_info, summary, experience, skills
       FROM cv_data WHERE id = $1 AND user_id = $2`,
      [cvId, session.user.id]
    );
    if (cvResult.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }
    const cv = cvResult.rows[0];

    // Upsert any newly-provided reusable answers into the bank - this is
    // what makes the *next* letter need to ask fewer questions.
    if (answers && typeof answers === 'object') {
      for (const key of REUSABLE_QUESTION_KEYS) {
        const value = answers[key];
        if (typeof value === 'string' && value.trim()) {
          await db.query(
            `INSERT INTO user_letter_answers (user_id, question_key, answer_text, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, question_key)
             DO UPDATE SET answer_text = EXCLUDED.answer_text, updated_at = NOW()`,
            [session.user.id, key, value.trim()]
          );
        }
      }
    }

    // Read back the full merged bank (newly-saved answers plus anything
    // from earlier letters) so the prompt always has the complete picture,
    // not just what was submitted in this request.
    const bankResult = await db.query(
      `SELECT question_key, answer_text FROM user_letter_answers WHERE user_id = $1`,
      [session.user.id]
    );
    const answerBank: Record<string, string> = {};
    for (const row of bankResult.rows) {
      answerBank[row.question_key] = row.answer_text;
    }

    const message = await anthropic.messages.create({
      model,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are an expert film and theatre industry career coach helping someone write a cover letter. Your job is not to write generic corporate copy - it's to turn their own words and details into a letter that sounds like them, for a role they're genuinely applying to.

COACHING PRINCIPLES:
1. Never use AI-tell language: avoid "spearheaded," "leveraged," "utilized," "dynamic," "results-driven," "passionate about," "seamlessly," "robust," "self-starter," or stacking em-dashes for emphasis.
2. Use the specific details given below - the proud moment, the stated motivation, the named strengths - don't invent generic substitutes for them. If a detail isn't given, don't fabricate one; write around it instead.
3. Sound like one specific person wrote this for one specific job, not a template. Reference the company/role by name naturally, not just at the top.
4. Standard structure: a genuine opening (not "I am writing to apply for..."), 1-2 body paragraphs connecting their real experience and the proud moment to what this role actually needs, and a confident, short close. Roughly 250-400 words.

Applying to: ${companyName ? `${companyName} - ` : ''}${jobTitle}
${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}

Candidate's CV:
Name: ${cv.name}
Summary: ${cv.summary || 'Not provided'}
Experience: ${JSON.stringify(cv.experience || [])}
Skills: ${(cv.skills || []).join(', ')}

What draws them to this industry/kind of work: ${answerBank.motivation || 'Not provided'}
A specific moment they're proud of: ${answerBank.proud_moment || 'Not provided'}
What they bring, in their own words: ${answerBank.strengths || 'Not provided'}

Write the cover letter now. Return ONLY the letter text, no additional commentary, no markdown formatting, no subject line.`
        }
      ]
    });

    if (message.stop_reason === 'max_tokens') {
      console.error('Cover letter generation truncated', { cvId, model, usage: message.usage });
      return NextResponse.json(
        { error: 'Your draft was too long to complete in one pass. Try again.' },
        { status: 502 }
      );
    }

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }
    const content = textContent.text.trim();

    // Every letter belongs to an application. Writing one for a role you
    // haven't logged yet creates the application implicitly - the user is
    // clearly going for the job, so making them declare it twice is friction
    // for nothing.
    let finalApplicationId: string | null = applicationId || null;
    if (finalApplicationId) {
      const owns = await db.query(
        `SELECT id FROM applications WHERE id = $1 AND user_id = $2`,
        [finalApplicationId, session.user.id]
      );
      if (owns.rows.length === 0) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      // Keep the application current with whatever was typed into the letter
      // form, and attach the CV if it didn't have one.
      await db.query(
        `UPDATE applications
         SET company_name = COALESCE($1, company_name),
             job_description = COALESCE($2, job_description),
             cv_id = COALESCE(cv_id, $3),
             updated_at = NOW()
         WHERE id = $4`,
        [companyName || null, jobDescription || null, cvId, finalApplicationId]
      );
    } else {
      const created = await db.query(
        `INSERT INTO applications (
           user_id, cv_id, company_name, job_title, job_description, status, updated_at
         ) VALUES ($1, $2, $3, $4, $5, 'draft', NOW())
         RETURNING id`,
        [session.user.id, cvId, companyName || null, jobTitle.trim(), jobDescription || null]
      );
      finalApplicationId = created.rows[0].id;
    }

    const result = await db.query(
      `INSERT INTO cover_letters (user_id, cv_id, application_id, company_name, job_title, job_description, content, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        session.user.id,
        cvId,
        finalApplicationId,
        companyName || null,
        jobTitle.trim(),
        jobDescription || null,
        content
      ]
    );

    return NextResponse.json({
      success: true,
      letterId: result.rows[0].id,
      applicationId: finalApplicationId,
      content
    });
  } catch (error: any) {
    console.error('Cover letter generation error:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      anthropicError: error?.error,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to generate cover letter', details: error.message },
      { status: 500 }
    );
  }
}
