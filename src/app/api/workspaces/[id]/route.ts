import { NextResponse } from 'next/server';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { deleteWorkspace, getWorkspaceForMember } from '@/lib/services/workspace';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const workspace = await getWorkspaceForMember(id, user.id);
    return NextResponse.json({ workspace });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    await deleteWorkspace(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
