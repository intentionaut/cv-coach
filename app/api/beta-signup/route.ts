import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';

/**
 * Private beta waitlist signup.
 *
 * Public and unauthenticated by design - this is the one write endpoint a
 * stranger can reach, so it validates hard and stores almost nothing.
 *
 * Writes to our own table first, then forwards to MailerLite if a key is
 * configured. That order is deliberate: MailerLite owns the mailing list and
 * everything about sending, but it's a third party that can be down, and
 * losing a signup because their API blinked would be the worst possible
 * failure here. The local row is the receipt; the forward is best-effort.
 */

const STAGES = [
  'Final year student',
  'Recently graduated',
  'Between productions',
  'Actively interviewing',
  'Just curious'
];

// Deliberately loose. Strict email regexes reject valid addresses, and the
// only real confirmation is whether the invite arrives.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function forwardToMailerLite(email: string, stage: string | null) {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return;

  const groupId = process.env.MAILERLITE_GROUP_ID;
  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email,
        fields: stage ? { search_stage: stage } : undefined,
        groups: groupId ? [groupId] : undefined
      })
    });
    if (!response.ok) {
      console.error('MailerLite forward failed', {
        status: response.status,
        body: (await response.text()).slice(0, 300)
      });
    }
  } catch (error: any) {
    // Never surfaced to the user: their signup is already saved.
    console.error('MailerLite forward threw', { message: error?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, stage, source } = await req.json();

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL.test(cleanEmail) || cleanEmail.length > 255) {
      return NextResponse.json(
        { error: "That doesn't look like an email address. Mind checking it?" },
        { status: 400 }
      );
    }

    // Anything not on the list is dropped rather than rejected - a stale
    // client sending an old option shouldn't cost someone their signup.
    const cleanStage = STAGES.includes(stage) ? stage : null;
    const cleanSource =
      typeof source === 'string' && source.length <= 120 ? source : null;

    // Signing up twice is a normal thing to do, not an error. The second one
    // updates stage/source if they've told us something new, and leaves
    // invited_at alone so nobody gets re-invited.
    await db.query(
      `INSERT INTO beta_signups (email, stage, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET stage = COALESCE(EXCLUDED.stage, beta_signups.stage),
           source = COALESCE(EXCLUDED.source, beta_signups.source)`,
      [cleanEmail, cleanStage, cleanSource]
    );

    await forwardToMailerLite(cleanEmail, cleanStage);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Beta signup error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Something went wrong saving that. Please try again.' },
      { status: 500 }
    );
  }
}
