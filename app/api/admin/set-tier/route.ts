import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserByEmail, setUserTier } from '@/lib/auth';
import { isValidTier } from '@/lib/tier';

const ADMIN_EMAIL = 'dasilvasaielle@gmail.com';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { email, tier } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!isValidTier(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: `No user found for ${email}` }, { status: 404 });
  }

  await setUserTier(user.id, tier);

  return NextResponse.json({ success: true });
}
