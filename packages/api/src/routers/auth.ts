import { userToPublicUser } from '@acme/core/backend/helpers/users';
import { encodeAuthJWT } from '@acme/core/backend/jwt';
import {
  AUDIT_LOG_LOGIN,
  AUDIT_LOG_USER_CREATED,
  AUDIT_LOG_USER_DELETED,
  AUDIT_LOG_USERNAME_CHANGED,
  CSRF_COOKIE,
  LOGIN_COOKIE,
} from '@acme/core/constants';
import type { PublicUser } from '@acme/core/types';
import { db, eq } from '@acme/db/drizzle';
import { AuditLog, User } from '@acme/db/schema';
import { ipAddress } from '@vercel/functions';
import { cookies } from 'next/headers';

import { env } from '../env';
import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc';

const _loginUser = async (
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
  const pubUser = await userToPublicUser(user);

  return {
    accessToken,
    user: pubUser,
  };
};

export const authRouter = createTRPCRouter({
  currentUser: publicProcedure.query(async ({ ctx: { currentUser } }) => {
    if (!currentUser) {
      return null;
    }
    return userToPublicUser(currentUser);
  }),
  deleteAccount: privateProcedure.mutation(async ({ ctx: { req, currentUser } }) => {
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_DELETED,
      ip: ipAddress(req),
      userAgent: req.headers.get('user-agent'),
      userId: currentUser.id,
    });
    await db.delete(User).where(eq(User.id, currentUser.id));
    const cookieStore = await cookies();

    cookieStore.delete(LOGIN_COOKIE);
    cookieStore.delete(CSRF_COOKIE);
  }),
  isAuthenticated: publicProcedure.query(({ ctx: { currentUser } }) => {
    return !!currentUser;
  }),
  signOut: privateProcedure.mutation(async () => {
    const cookieStore = await cookies();
    cookieStore.delete(LOGIN_COOKIE);
    cookieStore.delete(CSRF_COOKIE);
  }),
});
