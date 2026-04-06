import { NextResponse } from 'next/server';
import { getInvitePreviewByRawToken } from '@/lib/services/invitation';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const preview = await getInvitePreviewByRawToken(decodeURIComponent(token));

  if (!preview.valid) {
    const status = preview.reason === 'expired' ? 410 : 404;
    const message =
      preview.reason === 'expired' ? 'Invitation has expired' : 'Invalid invitation';
    return NextResponse.json({ valid: false, error: message, reason: preview.reason }, { status });
  }

  return NextResponse.json({
    valid: true,
    workspaceName: preview.workspaceName,
    role: preview.role,
    email: preview.email,
  });
}
