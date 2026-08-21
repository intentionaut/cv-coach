import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { getUserTier } from '@/lib/auth';
import { getTierLimits } from '@/lib/tier';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier(session.user.id);
    const { maxCvs } = getTierLimits(tier);

    const result = await db.query(
      `SELECT cd.id, cd.name, cd.summary, cd.updated_at,
        EXISTS(
          SELECT 1 FROM coaching_recommendations cr
          WHERE cr.cv_id = cd.id AND cr.type = 'cv_analysis'
        ) AS has_analysis,
        (
          SELECT (cr.action_items->>'overallScore')::int
          FROM coaching_recommendations cr
          WHERE cr.cv_id = cd.id AND cr.type = 'cv_analysis'
          ORDER BY cr.created_at DESC LIMIT 1
        ) AS score
       FROM cv_data cd
       WHERE cd.user_id = $1
       ORDER BY cd.created_at ASC`,
      [session.user.id]
    );

    return NextResponse.json({
      cvs: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        summary: row.summary || '',
        updatedAt: row.updated_at,
        hasAnalysis: row.has_analysis,
        score: row.score
      })),
      maxCvs
    });
  } catch (error: any) {
    console.error('CV list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CVs', details: error.message },
      { status: 500 }
    );
  }
}
