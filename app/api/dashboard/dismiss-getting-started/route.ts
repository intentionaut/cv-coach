import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dismissGettingStarted } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dismissGettingStarted(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Dismiss getting-started error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss', details: error.message },
      { status: 500 }
    );
  }
}
