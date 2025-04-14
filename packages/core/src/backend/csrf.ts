import { getCookie, setCookie } from 'cookies-next';
import type { webcrypto } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE, CSRF_EXPIRES } from '../constants';
import { env } from '../env';

// we can't use crypto.randomBytes
// https://nextjs.org/docs/messages/node-module-in-edge-runtime
export function createCSRFToken(length = 80): string {
  const i2hex = (i: number) => ('0' + i.toString(16)).slice(-2);
  const r = (a: string, i: number): string => a + i2hex(i);
  const bytes = crypto.getRandomValues(new Uint8Array(length / 2));
  return Array.from(bytes).reduce(r, '');
}

export async function setCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
  res: NextResponse | NextApiResponse | ServerResponse<IncomingMessage>,
  token?: string,
): Promise<string> {
  if (!token) {
    token = createCSRFToken();
  }
  if (res instanceof NextResponse) {
    res.cookies.set({
      maxAge: CSRF_EXPIRES,
      name: CSRF_COOKIE,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      value: token,
    });
    return token;
  }
  if (req instanceof NextRequest) {
    throw new Error('This should never happen');
  }
  // Let's use the new cookies api from nextjs
  /*const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    maxAge: CSRF_EXPIRES,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
  */
  await setCookie(CSRF_COOKIE, token, {
    maxAge: CSRF_EXPIRES,
    req,
    res,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
  return token;
}

export async function getCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
): Promise<string | null> {
  if (req instanceof NextRequest) {
    return req.cookies.get(CSRF_COOKIE)?.value ?? null;
  }

  // Let's use the new cookies api from nextjs
  //const cookieStore = await cookies();
  // const cookieToken = cookieStore.get(CSRF_COOKIE)?.value ?? (await getCookie(CSRF_COOKIE, { req }));

  const cookieToken = await getCookie(CSRF_COOKIE, { req });

  if (!cookieToken) {
    return null;
  }
  return cookieToken;
}

export async function validateCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
  token: string | null,
): Promise<boolean> {
  if (!token) {
    return false;
  }
  const cookieToken = await getCSRFTokenCookie(req);
  if (!cookieToken) {
    return false;
  }
  if (cookieToken.length != token.length) {
    return false;
  }

  const encoder = new TextEncoder();
  return timingSafeEqual(encoder.encode(token), encoder.encode(cookieToken));
}

async function timingSafeEqual(bufferSource1: webcrypto.BufferSource, bufferSource2: webcrypto.BufferSource) {
  // https://github.com/w3c/webcrypto/issues/270#issuecomment-1899234835
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const key = (await crypto.subtle.generateKey(algorithm, false, ['sign', 'verify'])) as webcrypto.CryptoKey;
  const hmac = await crypto.subtle.sign(algorithm, key, bufferSource1);
  const equal = await crypto.subtle.verify(algorithm, key, hmac, bufferSource2);
  return equal;
}
