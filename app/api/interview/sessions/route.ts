import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

// GET: Fetch user's practice sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch practice sessions with question count
    const result = await db.query(
      `SELECT
        ips.id,
        ips.title,
        ips.session_type,
        ips.started_at,
        ips.completed_at,
        ips.total_time_minutes,
        ips.overall_confidence,
        ips.overall_clarity,
        ips.role_id,
        jr.title as role_title,
        COUNT(is_resp.id) as question_count
       FROM interview_practice_sessions ips
       LEFT JOIN job_roles jr ON ips.role_id = jr.id
       LEFT JOIN interview_sessions is_resp ON is_resp.practice_session_id = ips.id
       WHERE ips.user_id = $1
       GROUP BY ips.id, jr.title
       ORDER BY ips.started_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      sessions: result.rows
    });
  } catch (error: any) {
    console.error('Fetch sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new practice session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, session_type, role_id } = await req.json();

    const result = await db.query(
      `INSERT INTO interview_practice_sessions (user_id, title, session_type, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [session.user.id, title, session_type || 'general', role_id || null]
    );

    return NextResponse.json({
      sessionId: result.rows[0].id
    });
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}
