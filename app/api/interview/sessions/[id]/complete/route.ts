import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { overall_confidence, overall_clarity, notes } = await req.json();
    const { id: sessionId } = await params;

    // Update practice session with completion data.
    // total_time_minutes is computed server-side from started_at (not client-supplied)
    // so it's accurate regardless of page reloads/navigation and can't be spoofed.
    await db.query(
      `UPDATE interview_practice_sessions
       SET completed_at = NOW(),
           overall_confidence = $1,
           overall_clarity = $2,
           total_time_minutes = ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60),
           notes = $3
       WHERE id = $4 AND user_id = $5`,
      [
        overall_confidence || null,
        overall_clarity || null,
        notes || null,
        sessionId,
        session.user.id
      ]
    );

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Complete session error:', error);
    return NextResponse.json(
      { error: 'Failed to complete session', details: error.message },
      { status: 500 }
    );
  }
}
