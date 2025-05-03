import { validateCSRFTokenCookie } from '@workspace/core/backend/csrf';
import { APP_NAME, APP_SCHEME, WAKATIME_API_URI, WAKATIME_REDIRECT_URI, WAKATIME_TOKEN_URL } from '@workspace/core/constants';
import type { WakaTimeUser } from '@workspace/core/types';
import { isNonEmptyString, parseJSONObject } from '@workspace/core/validators';
import { db, eq } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';
import { registerWithDirectory } from '@workspace/tasks/register/registerWithDirectory';
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
  follow: z.string().optional().nullable(),
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

  if (s.data.m) {
    const params = new URLSearchParams({
      code: code ?? '',
    });
    return NextResponse.redirect(`${APP_SCHEME}login/callback?${params.toString()}`);
  }

  if (!(await validateCSRFTokenCookie(req, s.data.c))) {
    return new NextResponse('Invalid CSRF token.', { status: 400 });
  }

  const tokenResponse = await fetch(WAKATIME_TOKEN_URL, {
    method: 'POST',
    body: JSON.stringify({
      client_id: env.WAKATIME_APP_ID,
      client_secret: env.WAKATIME_APP_SECRET,
      redirect_uri: WAKATIME_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': APP_NAME,
    },
  });

  if (tokenResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const accessToken = ((await tokenResponse.json()) as { access_token: string }).access_token;

  const wakatimeResponse = await fetch(`${WAKATIME_API_URI}/users/current`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': APP_NAME,
    },
  });

  if (wakatimeResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const wakatimeUser = (parseJSONObject(await wakatimeResponse.text()) as { data: WakaTimeUser }).data;
  const wakatimeId = wakatimeUser.id;
  const wakatimeUsername = wakatimeUser.username;

  const [user, isNewUser] = await db.transaction(async (tx) => {
    const user = await tx.query.User.findFirst({ where: eq(User.id, wakatimeId) });
    if (user) {
      return [user, false];
    }
    const anyUser = await tx.query.User.findFirst({ columns: { id: true } });
    const [newUser] = await tx
      .insert(User)
      .values({
        id: wakatimeId,
        username: wakatimeUsername,
        fullName: wakatimeUser.full_name,
        avatarUrl: wakatimeUser.photo,
        isOwner: anyUser ? null : true, // first sign up is the owner
        accessToken,
      })
      .onConflictDoNothing()
      .returning();
    if (newUser) {
      return [newUser, true];
    }
    return [await tx.query.User.findFirst({ where: eq(User.id, wakatimeId) }), false];
  });

  if (!user) {
    return new NextResponse('User not found.', { status: 404 });
  }

  if (isNewUser) {
    await registerWithDirectory.enqueue();
  }

  await loginUser(user, wakatimeUsername, isNewUser);

  return NextResponse.redirect(makeUrlSafe(s.data.n, '/onboarding'));
};
