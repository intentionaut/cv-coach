import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

// GET: Fetch history for a specific question across all sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const questionText = searchParams.get('question');

    if (!questionText) {
      return NextResponse.json(
        { error: 'Question parameter required' },
        { status: 400 }
      );
    }

    // Fetch all responses to this specific question
    // Ordered by date to show progression over time
    const result = await db.query(
      `SELECT
        is_sess.id,
        is_sess.written_answer,
        is_sess.confidence_score,
        is_sess.clarity_score,
        is_sess.ai_feedback,
        is_sess.completed_at,
        ips.title as session_title,
        ips.session_type,
        jr.title as role_title,
        jr.id as role_id
       FROM interview_sessions is_sess
       JOIN interview_practice_sessions ips ON is_sess.practice_session_id = ips.id
       LEFT JOIN job_roles jr ON ips.role_id = jr.id
       WHERE is_sess.user_id = $1 AND is_sess.question = $2
       ORDER BY is_sess.completed_at ASC`,
      [session.user.id, questionText]
    );

    // Calculate improvement metrics
    const responses = result.rows;
    let improvementTrend = null;

    if (responses.length >= 2) {
      const firstScores = {
        confidence: responses[0].confidence_score,
        clarity: responses[0].clarity_score
      };
      const latestScores = {
        confidence: responses[responses.length - 1].confidence_score,
        clarity: responses[responses.length - 1].clarity_score
      };

      if (firstScores.confidence && firstScores.clarity && latestScores.confidence && latestScores.clarity) {
        const firstAvg = (firstScores.confidence + firstScores.clarity) / 2;
        const latestAvg = (latestScores.confidence + latestScores.clarity) / 2;
        improvementTrend = ((latestAvg - firstAvg) / firstAvg * 100).toFixed(1);
      }
    }

    // Group by role to show performance variations
    const byRole: { [key: string]: any[] } = {};
    responses.forEach((response: any) => {
      const roleKey = response.role_id || 'general';
      if (!byRole[roleKey]) {
        byRole[roleKey] = [];
      }
      byRole[roleKey].push(response);
    });

    return NextResponse.json({
      questionText,
      totalAttempts: responses.length,
      improvementTrend,
      responses,
      byRole,
      latestResponse: responses.length > 0 ? responses[responses.length - 1] : null
    });
  } catch (error: any) {
    console.error('Question history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question history', details: error.message },
      { status: 500 }
    );
  }
}
