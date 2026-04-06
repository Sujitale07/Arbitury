import { Resend } from 'resend';
import { normalizeEmail } from '@/lib/invite-token';

const fromDefault = 'Arbitury <onboarding@sujitmagar.com.np>';

export async function sendWorkspaceInviteEmail(params: {
  to: string;
  workspaceName: string;
  acceptUrl: string;
}) {
  const to = normalizeEmail(params.to);
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || fromDefault;

  if (!key) {
    console.info('[invite] RESEND_API_KEY missing — invite link (dev):', params.acceptUrl);
    return { sent: false as const, skipped: 'no_api_key' as const };
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `You're invited to ${params.workspaceName} on Arbitury`,
    html: `<p>You've been invited to collaborate on <strong>${escapeHtml(params.workspaceName)}</strong>.</p>
<p><a href="${escapeAttr(params.acceptUrl)}">Accept invitation</a></p>
<p>If you did not expect this, you can ignore this email.</p>`,
  });

  if (error) {
    console.error('[invite] Resend error:', error);
    throw new Error(error.message);
  }

  return { sent: true as const };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
