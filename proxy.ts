import { NextRequest, NextResponse } from 'next/server';

/**
 * Sends signed-in visitors from the marketing homepage to their dashboard.
 *
 * Named `proxy` rather than `middleware`: Next 16 deprecated the middleware
 * file convention and renamed it, and the dev server warns on the old name.
 *
 * This lives here rather than in the page so `/` can stay a fully
 * static, publicly cached server component. Reading the session inside the
 * page would make the route dynamic and lose CDN caching on the one page we
 * most want crawlers and first-time visitors to get instantly.
 *
 * It only checks whether a session cookie is *present* - it doesn't verify it.
 * That's fine for a redirect between two public-facing routes: the worst case
 * for a stale or forged cookie is landing on /dashboard, which does its own
 * real auth check and bounces you to /login. No authorisation decision is
 * being made here.
 *
 * Everything else - product pages, FAQ, legal, login - is untouched and stays
 * reachable without an account.
 */

// NextAuth prefixes the cookie with __Secure- when running over HTTPS.
const SESSION_COOKIES = ['next-auth.session-token', '__Secure-next-auth.session-token'];

export function proxy(request: NextRequest) {
  const signedIn = SESSION_COOKIES.some(name => request.cookies.has(name));
  if (signedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // The homepage only. Marketing and legal pages stay public for everyone,
  // signed in or not.
  matcher: ['/']
};
