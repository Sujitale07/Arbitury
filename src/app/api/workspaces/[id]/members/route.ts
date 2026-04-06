import { NextResponse } from 'next/server';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { listMembers } from '@/lib/services/membership';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const members = await listMembers(id, user.id);
    return NextResponse.json({ members });
  } catch (e) {
    return handleRouteError(e);
  }
}
