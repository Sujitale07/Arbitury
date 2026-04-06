import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { ApiError } from '@/lib/api-errors';
import { ensureDbUser } from '@/lib/auth/ensure-db-user';
import type { User } from '@prisma/client';

export function handleRouteError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  if (e instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request data', details: e.issues },
      { status: 400 }
    );
  }
  console.error(e);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function requireApiUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) {
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }
  try {
    return await ensureDbUser(userId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not sync user';
    throw new ApiError(400, msg, 'AUTH_SYNC');
  }
}
