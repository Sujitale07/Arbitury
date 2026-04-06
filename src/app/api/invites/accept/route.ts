import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { acceptInvitation } from '@/lib/services/invitation';

const bodySchema = z.object({
  token: z.string().min(16),
});

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = await req.json();
    const { token } = bodySchema.parse(body);
    const result = await acceptInvitation(user.id, user.email, token);
    return NextResponse.json(result);
  } catch (e) {
    return handleRouteError(e);
  }
}
