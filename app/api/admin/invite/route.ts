import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { findOrCreateUserForInvite, createPasswordResetToken } from '@/lib/auth';
import { sendSetPasswordInviteEmail } from '@/lib/email';

const ADMIN_EMAIL = 'dasilvasaielle@gmail.com';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { email, name } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await findOrCreateUserForInvite(email, name || 'Film Student');
    const token = await createPasswordResetToken(user.id);

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const setPasswordUrl = `${baseUrl}/set-password/${token}`;

    await sendSetPasswordInviteEmail(user.email, setPasswordUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send invite' },
      { status: 500 }
    );
  }
}
