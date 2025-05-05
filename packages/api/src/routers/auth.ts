import { ipAddress } from '@vercel/functions';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { AUDIT_LOG_USER_DELETED, CSRF_COOKIE, LOGIN_COOKIE } from '@workspace/core/constants';
import { db, eq } from '@workspace/db/drizzle';
import { AuditLog, User } from '@workspace/db/schema';
import { cookies } from 'next/headers';

import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc';

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
