import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db/client';
import { runAtsChecks } from '@/lib/ats/checks';

// No Claude call and no maxDuration needed - every check is deterministic
// (see lib/ats/checks.ts), so this returns in milliseconds and costs nothing
// per run. That's deliberate: it means the score is reproducible and can be
// re-run freely without the user weighing it against usage limits.
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
      `SELECT personal_info, summary, experience, education, skills, raw_text
       FROM cv_data WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    const cv = result.rows[0];
    const report = runAtsChecks({
      contact: cv.personal_info || {},
      summary: cv.summary || '',
      experience: cv.experience || [],
      education: cv.education || [],
      skills: cv.skills || [],
      rawText: cv.raw_text
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('ATS check error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to run ATS checks', details: error.message },
      { status: 500 }
    );
  }
}
