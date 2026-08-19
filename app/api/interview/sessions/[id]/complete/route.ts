import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { overall_confidence, overall_clarity, total_time_minutes, notes } = await req.json();
    const sessionId = params.id;

    // Update practice session with completion data
    await db.query(
      `UPDATE interview_practice_sessions
       SET completed_at = NOW(),
           overall_confidence = $1,
           overall_clarity = $2,
           total_time_minutes = $3,
           notes = $4
       WHERE id = $5 AND user_id = $6`,
      [
        overall_confidence || null,
        overall_clarity || null,
        total_time_minutes || 0,
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
