import { createCSRFToken } from '@acme/core/backend/csrf';
import { CSRF_COOKIE, CSRF_EXPIRES, WAKATIME_AUTHORIZE_URL, WAKATIME_REDIRECT_URI } from '@acme/core/constants';
import type { OAuthLoginState } from '@acme/core/types';
import { validateUsername } from '@acme/core/validators';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '~/env';
import { makeUrlSafe } from '~/utils/urlHelpers';

export const GET = async (req: NextRequest) => {
  const username = req.nextUrl.searchParams.get('username');
  const next = req.nextUrl.searchParams.get('next');
  const isMobile = req.nextUrl.searchParams.get('device') === 'mobile';

  const token = createCSRFToken();
  const cookieStore = await cookies();
  cookieStore.set({
    maxAge: CSRF_EXPIRES,
    name: CSRF_COOKIE,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    value: token,
  });
  const nextUrl = getNextUrl(username, next);
  const state: OAuthLoginState = { c: token, n: nextUrl.toString(), m: isMobile };

  const params = new URLSearchParams({
    client_id: env.WAKATIME_APP_ID,
    redirect_uri: WAKATIME_REDIRECT_URI,
    scope: '',
    state: btoa(JSON.stringify(state)),
  });
  const redirectUrl = `${WAKATIME_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(redirectUrl);
};

function getNextUrl(username: unknown, next: unknown): URL {
  if (typeof username === 'string' && !validateUsername(username).error) {
    return makeUrlSafe(`/signup?username=${username}`);
  } else if (typeof next === 'string') {
    return makeUrlSafe(next);
  }
  return makeUrlSafe('/');
}
