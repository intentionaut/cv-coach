import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.query(
      `SELECT id, name, personal_info, summary, experience, education, skills, projects, updated_at
       FROM cv_data
       WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    const cvData = result.rows[0];

    // action_items holds the full analysis object as of the fix that added
    // this, but older rows only hold a bare priorityImprovements array -
    // treat those as no cached analysis rather than spreading an array into
    // a broken {0: ..., 1: ...} object with no priorityImprovements key.
    const analysisResult = await db.query(
      `SELECT action_items, created_at
       FROM coaching_recommendations
       WHERE cv_id = $1 AND type = 'cv_analysis'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );

    const cachedAnalysis = analysisResult.rows[0]?.action_items;
    const hasFullAnalysis =
      cachedAnalysis && !Array.isArray(cachedAnalysis) && typeof cachedAnalysis === 'object';

    return NextResponse.json({
      id: cvData.id,
      name: cvData.name,
      cv: {
        contact: cvData.personal_info || {},
        summary: cvData.summary || '',
        experience: cvData.experience || [],
        education: cvData.education || [],
        skills: cvData.skills || [],
        projects: cvData.projects || [],
        updatedAt: cvData.updated_at
      },
      analysis: hasFullAnalysis ? {
        ...cachedAnalysis,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await req.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE cv_data SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id`,
      [name.trim(), id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CV rename error:', error);
    return NextResponse.json(
      { error: 'Failed to rename CV', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await db.query(
      `DELETE FROM cv_data WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CV delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete CV', details: error.message },
      { status: 500 }
    );
  }
}
