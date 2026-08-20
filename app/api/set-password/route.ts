import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken } from '@/lib/auth';

// Public endpoint (no session) — the invite token itself is the credential.
export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  try {
    const ok = await consumePasswordResetToken(token, password);

    if (!ok) {
      return NextResponse.json(
        { error: 'This link is invalid, expired, or has already been used.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error consuming set-password token:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
