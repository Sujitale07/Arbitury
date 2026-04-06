import { NextResponse } from 'next/server';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { listPendingInvitations } from '@/lib/services/invitation';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const invitations = await listPendingInvitations(id, user.id);
    return NextResponse.json({ invitations });
  } catch (e) {
    return handleRouteError(e);
  }
}
