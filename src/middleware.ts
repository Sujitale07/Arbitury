import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Only these routes are reachable without a Clerk session.
 * Everything else (including `/` dashboard) requires sign-in.
 */
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite(.*)',
  // External / unauthenticated callers (add CRON_SECRET check in route when deploying)
  '/api/seo/cron(.*)',
]);

/** GET /api/invites/:token preview — public; POST /api/invites/accept stays protected */
function isPublicInviteMetadataApi(pathname: string) {
  const m = pathname.match(/^\/api\/invites\/([^/]+)$/);
  if (!m) return false;
  return m[1] !== 'accept';
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (isPublicRoute(req) || isPublicInviteMetadataApi(pathname)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
