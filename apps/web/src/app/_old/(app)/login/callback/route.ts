import { validateCSRFTokenCookie } from '@acme/core/backend/csrf';
import { APP_NAME, APP_SCHEME, WAKATIME_REDIRECT_URI, WAKATIME_TOKEN_URL } from '@acme/core/constants';
import { wonderfulFetch } from '@acme/core/integrations/helpers';
import { isNonEmptyString, parseJSONObject } from '@acme/core/validators';
import { and, db, eq } from '@acme/db/drizzle';
import type { GitHubUser } from '@acme/db/schema';
import { Integration, IntegrationIdentifier, User, UserInfo } from '@acme/db/schema';
import { addUserFollowersFromGitHub } from '@acme/tasks/userActions/addUserFollowersFromGitHub';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '~/env';
import { loginUser } from '~/utils/server-auth';
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

  const response = await wonderfulFetch(WAKATIME_TOKEN_URL, {
    body: JSON.stringify({
      client_id: env.WAKATIME_APP_ID,
      client_secret: env.WAKATIME_APP_SECRET,
      code,
      redirect_uri: WAKATIME_REDIRECT_URI,
    }),
    headers: {
      'User-Agent': APP_NAME,
    },
    method: 'POST',
  });

  if (response.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const accessToken = ((await response.json()) as { access_token: string }).access_token;

  const url = 'https://api.wakatime.com/api/v1/users/current';
  const githubResponse = await wonderfulFetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': APP_NAME,
    },
  });

  if (githubResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const githubUser = parseJSONObject(await githubResponse.text()) as GitHubUser;
  const githubId = githubUser.id;
  const username = githubUser.login;

  let isNewUser = false;
  let user = await db.query.User.findFirst({ where: eq(User.githubId, githubId) });
  if (!user) {
    const integration = await db.query.Integration.findFirst({
      where: and(eq(Integration.provider, IntegrationIdentifier.GitHub), eq(Integration.providerAccountId, String(githubId))),
      with: {
        user: true,
      },
    });
    if (integration) {
      user = integration.user;
    }
    if (!user) {
      user = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(User)
          .values({
            githubId,
            fullName: githubUser.name,
          })
          .onConflictDoNothing()
          .returning();
        if (!newUser) {
          return await tx.query.User.findFirst({ where: eq(User.githubId, githubId) });
        }
        await tx.insert(UserInfo).values({
          accessToken,
          githubFullName: githubUser.name,
          githubUser,
          userId: newUser.id,
        });
        return newUser;
      });
      if (!user) {
        user = await db.query.User.findFirst({ where: eq(User.githubId, githubId) });
        if (!user) {
          throw new Error('User not found.');
        }
      } else {
        isNewUser = true;
        await addUserFollowersFromGitHub.enqueue(user.id);
      }
    }
  }

  if (!isNewUser) {
    await db.update(UserInfo).set({ accessToken }).where(eq(UserInfo.userId, user.id));
  }

  await loginUser(user, username, isNewUser);

  return NextResponse.redirect(makeUrlSafe(s.data.n, '/onboarding'));
};
