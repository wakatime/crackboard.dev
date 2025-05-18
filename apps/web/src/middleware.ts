import { setCSRFTokenCookie, validateCSRFTokenCookie } from '@workspace/core/backend/csrf';
import { CSRF_COOKIE, CSRF_PROTECTED_METHODS, CSRF_TOKEN_HEADER } from '@workspace/core/constants';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const isMobileApp = (req: NextRequest) => {
  return req.headers.get('x-trpc-source') === 'expo-react';
};

export async function middleware(req: NextRequest): Promise<NextResponse | void> {
  const isFromApp = isMobileApp(req);

  // validate csrf token on modifying requests
  const method = req.method.toUpperCase();
  if (!isFromApp && CSRF_PROTECTED_METHODS.includes(method)) {
    const token = req.headers.get(CSRF_TOKEN_HEADER);
    if (!(await validateCSRFTokenCookie(req, token))) {
      return new NextResponse('Invalid CSRF Token', {
        headers: { 'content-type': 'text/plain' },
        status: 403,
      });
    }
  }

  // run the original request
  const res = NextResponse.next();

  // set csrf token cookie if not already set
  if (!isFromApp && !req.cookies.get(CSRF_COOKIE)) {
    await setCSRFTokenCookie(req, res);
  }

  return res;
}

// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - webhooks (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, logo.svg, logo.png, site.webmanifest, browserconfig.xml (metadata files)
     */
    '/((?!api|webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo.svg|logo.png|site.webmanifest|browserconfig.xml).*)',
  ],
};
