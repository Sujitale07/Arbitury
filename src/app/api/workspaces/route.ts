import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError, requireApiUser } from '@/lib/api-handler';
import { createWorkspace, listWorkspacesForUser } from '@/lib/services/workspace';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
});

export async function GET() {
  try {
    const user = await requireApiUser();
    const list = await listWorkspacesForUser(user.id);
    return NextResponse.json({ workspaces: list });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = await req.json();
    const { name } = createSchema.parse(body);
    const ws = await createWorkspace(user.id, name);
    return NextResponse.json({ workspace: ws }, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
