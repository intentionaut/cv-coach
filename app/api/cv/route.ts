import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get CV data for user
    const result = await db.query(
      `SELECT personal_info, summary, experience, education, skills, projects, updated_at
       FROM cv_data
       WHERE user_id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const cvData = result.rows[0];

    // Get latest coaching recommendations (analysis) - action_items holds
    // the full analysis object, not just priorityImprovements, so a
    // returning user's analysis view can be rebuilt without another
    // Claude call.
    const analysisResult = await db.query(
      `SELECT action_items, created_at
       FROM coaching_recommendations
       WHERE user_id = $1 AND type = 'cv_analysis'
       ORDER BY created_at DESC
       LIMIT 1`,
      [session.user.id]
    );

    return NextResponse.json({
      exists: true,
      cv: {
        contact: cvData.personal_info || {},
        summary: cvData.summary || '',
        experience: cvData.experience || [],
        education: cvData.education || [],
        skills: cvData.skills || [],
        projects: cvData.projects || [],
        updatedAt: cvData.updated_at
      },
      analysis: analysisResult.rows.length > 0 ? {
        ...(analysisResult.rows[0].action_items || {}),
        createdAt: analysisResult.rows[0].created_at
      } : null
    });
  } catch (error: any) {
    console.error('CV fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV', details: error.message },
      { status: 500 }
    );
  }
}
