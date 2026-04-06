import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/invite-token';

/**
 * Upsert app User from Clerk session. Call after auth() confirms userId.
 */
export async function ensureDbUser(clerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== clerkUserId) {
    throw new Error('Clerk user mismatch');
  }

  const primaryId = clerkUser.primaryEmailAddressId;
  const primary = clerkUser.emailAddresses.find((e) => e.id === primaryId)?.emailAddress;
  if (!primary) {
    throw new Error('No primary email');
  }

  const email = normalizeEmail(primary);
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    email.split('@')[0] ||
    'User';

  return prisma.user.upsert({
    where: { clerkId: clerkUserId },
    create: {
      clerkId: clerkUserId,
      email,
      name,
    },
    update: {
      email,
      name,
    },
  });
}
