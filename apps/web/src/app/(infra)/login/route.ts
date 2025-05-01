import { createCSRFToken } from '@workspace/core/backend/csrf';
import { CSRF_COOKIE, CSRF_EXPIRES, WAKATIME_AUTHORIZE_URL, WAKATIME_REDIRECT_URI } from '@workspace/core/constants';
import type { OAuthLoginState } from '@workspace/core/types';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '~/env';
import { makeUrlSafe } from '~/utils/urlHelpers';

export const GET = async (req: NextRequest) => {
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
  const state: OAuthLoginState = { c: token, n: makeUrlSafe(next ?? '/').toString(), m: isMobile };

  const params = new URLSearchParams({
    client_id: env.WAKATIME_APP_ID,
    response_type: 'code',
    redirect_uri: WAKATIME_REDIRECT_URI,
    scope: 'email,read_summaries.editors,read_summaries.languages',
    state: btoa(JSON.stringify(state)),
  });
  const redirectUrl = `${WAKATIME_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(redirectUrl);
};
