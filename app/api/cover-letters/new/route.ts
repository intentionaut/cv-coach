import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { getNeededAnswers } from '@/lib/data/cover-letter-questions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cvId = req.nextUrl.searchParams.get('cvId');
    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    const cvResult = await db.query(
      `SELECT name, summary, job_title, job_description FROM cv_data WHERE id = $1 AND user_id = $2`,
      [cvId, session.user.id]
    );
    if (cvResult.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }
    const cv = cvResult.rows[0];

    const bankResult = await db.query(
      `SELECT question_key, answer_text FROM user_letter_answers WHERE user_id = $1`,
      [session.user.id]
    );
    const answers: Record<string, string> = {};
    for (const row of bankResult.rows) {
      answers[row.question_key] = row.answer_text;
    }

    return NextResponse.json({
      cv: {
        name: cv.name,
        summary: cv.summary || '',
        jobTitle: cv.job_title || '',
        jobDescription: cv.job_description || ''
      },
      answers,
      needsAnswers: getNeededAnswers(answers)
    });
  } catch (error: any) {
    console.error('New cover letter setup error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to load cover letter setup', details: error.message },
      { status: 500 }
    );
  }
}
