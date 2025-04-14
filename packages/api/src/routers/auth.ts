import { createTestDevUser, userToPublicUser } from '@acme/core/backend/helpers';
import { encodeAuthJWT } from '@acme/core/backend/jwt';
import {
  APP_NAME,
  AUDIT_LOG_LOGIN,
  AUDIT_LOG_USER_CREATED,
  AUDIT_LOG_USER_DELETED,
  AUDIT_LOG_USERNAME_CHANGED,
  CSRF_COOKIE,
  LOGIN_COOKIE,
  TEST_USER_ID,
  WAKATIME_REDIRECT_URI,
  WAKATIME_TOKEN_URL,
} from '@acme/core/constants';
import { wonderfulFetch } from '@acme/core/integrations/helpers';
import type { PublicUser } from '@acme/core/types';
import { and, db, eq, gt, or } from '@acme/db/drizzle';
import type { GitHubUser } from '@acme/db/schema';
import {
  AdminUserLoginToken,
  AuditLog,
  Integration,
  IntegrationIdentifier,
  SuggestFollowUser,
  User,
  UserFollow,
  UserInfo,
} from '@acme/db/schema';
import { addUserFollowersFromGitHub } from '@acme/tasks/userActions/addUserFollowersFromGitHub';
import { TRPCError } from '@trpc/server';
import { ipAddress } from '@vercel/functions';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { env } from '../env';
import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc';

const loginUser = async (
  req: Request,
  user: typeof User.$inferSelect,
  username: string | null,
  isNewUser: boolean,
  skipAuditLog = false,
): Promise<{ accessToken: string; user: PublicUser }> => {
  if (!skipAuditLog) {
    await db.insert(AuditLog).values({
      event: isNewUser ? AUDIT_LOG_USER_CREATED : AUDIT_LOG_LOGIN,
      ip: ipAddress(req),
      userAgent: req.headers.get('user-agent'),
      metadata: { username: username },
      userId: user.id,
    });
  }

  // set username after user created in case the username is already taken
  if (username && !user.username) {
    try {
      await db.update(User).set({ username }).where(eq(User.id, user.id));
      if (!isNewUser && !skipAuditLog) {
        await db.insert(AuditLog).values({
          event: AUDIT_LOG_USERNAME_CHANGED,
          ip: ipAddress(req),
          userAgent: req.headers.get('user-agent'),
          metadata: { username: username },
          userId: user.id,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      /* empty */
    }
  }

  const accessToken = await encodeAuthJWT(user.sessionId, env.JWT_SECRET);
  return { accessToken, user: await userToPublicUser(user) };
};

export const authRouter = createTRPCRouter({
  currentUser: publicProcedure.query(async ({ ctx: { currentUser } }) => {
    if (!currentUser) {
      return null;
    }

    return await userToPublicUser(currentUser);
  }),
  deleteAccount: privateProcedure.mutation(async ({ ctx: { req, currentUser } }) => {
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_DELETED,
      ip: ipAddress(req),
      userAgent: req.headers.get('user-agent'),
      userId: currentUser.id,
    });
    await db.delete(UserFollow).where(or(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, currentUser.id)));
    await db.delete(Integration).where(eq(Integration.userId, currentUser.id));
    await db.delete(SuggestFollowUser).where(eq(SuggestFollowUser.userId, currentUser.id));
    await db.delete(User).where(eq(User.id, currentUser.id));
    const cookieStore = await cookies();

    cookieStore.delete(LOGIN_COOKIE);
    cookieStore.delete(CSRF_COOKIE);
  }),
  isAuthenticated: publicProcedure.query(({ ctx: { currentUser } }) => {
    return !!currentUser;
  }),
  signInWithGithubCode: publicProcedure.input(z.object({ code: z.string().min(1) })).mutation(async ({ ctx: { req }, input: { code } }) => {
    const res = await wonderfulFetch(WAKATIME_TOKEN_URL, {
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

    if (res.status !== 200) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid OAuth code.' });
    }

    const token = ((await res.json()) as { access_token: string }).access_token;

    const userEndPoint = 'https://api.wakatime.com/api/v1/users/current';
    const githubResponse = await wonderfulFetch(userEndPoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': APP_NAME,
      },
    });

    if (githubResponse.status !== 200) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid OAuth code.' });
    }

    const githubUser = (await githubResponse.json()) as GitHubUser;
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
            accessToken: token,
            githubFullName: githubUser.name,
            githubUser,
            userId: newUser.id,
          });
          return newUser;
        });
        if (!user) {
          user = await db.query.User.findFirst({ where: eq(User.githubId, githubId) });
          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
          }
        } else {
          isNewUser = true;
          await addUserFollowersFromGitHub.enqueue(user.id);
        }
      }
    }

    if (!isNewUser) {
      await db.update(UserInfo).set({ accessToken: token }).where(eq(UserInfo.userId, user.id));
    }

    return loginUser(req, user, username, isNewUser);
  }),
  signInWithToken: publicProcedure
    .input(z.object({ token: z.string(), userId: z.string() }))
    .mutation(async ({ ctx: { req }, input: { token, userId } }) => {
      const user = await db.query.User.findFirst({ where: eq(User.id, userId) });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const t = await db.query.AdminUserLoginToken.findFirst({
        where: and(
          eq(AdminUserLoginToken.id, token),
          eq(AdminUserLoginToken.userId, user.id),
          gt(AdminUserLoginToken.expiresAt, new Date()),
        ),
      });
      if (!t) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }
      return loginUser(req, user, null, false);
    }),
  signInAsTestUser: publicProcedure.mutation(async ({ ctx: { req } }) => {
    if (env.NODE_ENV !== 'development') {
      const user = await db.query.User.findFirst({ where: eq(User.id, TEST_USER_ID) });
      if (user) {
        return loginUser(req, user, null, true);
      }
    }

    const user = await createTestDevUser();
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return loginUser(req, user, null, true);
  }),
  signout: privateProcedure.mutation(async () => {
    const cookieStore = await cookies();
    cookieStore.delete(LOGIN_COOKIE);
    cookieStore.delete(CSRF_COOKIE);
  }),
});
