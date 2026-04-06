import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { createInvitation } from '@/lib/services/invitation';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = inviteSchema.parse(body);
    const result = await createInvitation(id, user.id, parsed.email, parsed.role);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
