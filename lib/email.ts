import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Friday <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not found. Email sending will fail.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Send a "set your password" invite email with a first-login link.
 */
export async function sendSetPasswordInviteEmail(
  toEmail: string,
  setPasswordUrl: string
): Promise<void> {
  if (!resend) {
    throw new Error('Email not configured. RESEND_API_KEY environment variable is missing.');
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Set your password for Friday',
    html: `
      <p>You've been invited to Friday, the Film Career Coach.</p>
      <p>Click the link below to set your password. This link expires in 24 hours and can only be used once.</p>
      <p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p>
      <p>If you didn't expect this email, you can ignore it.</p>
    `
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
