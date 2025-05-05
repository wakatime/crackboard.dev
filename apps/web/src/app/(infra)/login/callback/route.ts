import { validateCSRFTokenCookie } from '@workspace/core/backend/csrf';
import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { createOrUpdateUser } from '@workspace/core/backend/helpers/users';
import { incrementRateLimitCounter, isRateLimited } from '@workspace/core/backend/rateLimit';
import { APP_SCHEME, WAKATIME_API_URI, WAKATIME_REDIRECT_URI, WAKATIME_TOKEN_URL } from '@workspace/core/constants';
import type { WakaTimeUser } from '@workspace/core/types';
import { betterFetch } from '@workspace/core/utils/helpers';
import { isNonEmptyString, parseJSONObject } from '@workspace/core/validators';
import { registerWithDirectory } from '@workspace/tasks/register/registerWithDirectory';
import { syncUserSummaries } from '@workspace/tasks/summaries/syncUserSummaries';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '~/env';
import { loginUser } from '~/server/auth';
import { makeUrlSafe } from '~/utils/urlHelpers';

const stateSchema = z.object({
  c: z.string(),
  n: z.string().optional().nullable(),
  m: z.boolean().optional().nullable(),
  ic: z.string().optional().nullable(),
});

export const GET = async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!isNonEmptyString(code)) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const s = stateSchema.safeParse(parseJSONObject(state));

  if (!s.success) {
    console.error(s.error.message);
    return new NextResponse('Invalid OAuth state.', { status: 400 });
  }

  const config = await getLeaderboardConfig();
  if (config.isInviteOnly) {
    const ip = req.headers.get('X-Real-Ip');
    const key = `invite-code-ip-${ip}`;
    const count = await incrementRateLimitCounter(key);
    if (await isRateLimited(key, 10, count)) {
      return new NextResponse('Invalid invite code.', { status: 400 });
    }
    if (s.data.ic !== config.inviteCode) {
      console.error(`Invalid invite code: ${s.data.ic}`);
      return new NextResponse('Invalid invite code.', { status: 400 });
    }
  }

  if (s.data.m) {
    const params = new URLSearchParams({
      code: code ?? '',
    });
    return NextResponse.redirect(`${APP_SCHEME}login/callback?${params.toString()}`);
  }

  if (!(await validateCSRFTokenCookie(req, s.data.c))) {
    return new NextResponse('Invalid CSRF token.', { status: 400 });
  }

  const tokenResponse = await betterFetch(WAKATIME_TOKEN_URL, {
    method: 'POST',
    body: JSON.stringify({
      client_id: env.WAKATIME_APP_ID,
      client_secret: env.WAKATIME_APP_SECRET,
      redirect_uri: WAKATIME_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (tokenResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string; refresh_token: string };
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  const wakatimeResponse = await betterFetch(`${WAKATIME_API_URI}/users/current`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (wakatimeResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const wakatimeUser = (parseJSONObject(await wakatimeResponse.text()) as { data: WakaTimeUser }).data;

  const [user, isNewUser] = await createOrUpdateUser(wakatimeUser, accessToken, refreshToken);
  if (!user) {
    return new NextResponse('User not found.', { status: 404 });
  }

  if (isNewUser) {
    await registerWithDirectory.enqueue();
    await syncUserSummaries.enqueue(user.id);
  }

  await loginUser(user, wakatimeUser.username, isNewUser);

  return NextResponse.redirect(makeUrlSafe(s.data.n, '/onboarding'));
};
