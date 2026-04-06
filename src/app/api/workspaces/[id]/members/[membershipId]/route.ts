import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { removeMember, updateMemberRole } from '@/lib/services/membership';

const patchSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

type Ctx = { params: Promise<{ id: string; membershipId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, membershipId } = await ctx.params;
    const body = await req.json();
    const { role } = patchSchema.parse(body);
    await updateMemberRole(id, membershipId, user.id, role);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, membershipId } = await ctx.params;
    await removeMember(id, membershipId, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
