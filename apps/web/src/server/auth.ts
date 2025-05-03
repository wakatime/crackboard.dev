import { authenticatedUserFromRequest } from '@workspace/core/backend/auth';
import { encodeAuthJWT } from '@workspace/core/backend/jwt';
import { AUDIT_LOG_LOGIN, AUDIT_LOG_USER_CREATED, AUDIT_LOG_USERNAME_CHANGED, JWT_EXPIRES, LOGIN_COOKIE } from '@workspace/core/constants';
import { db, eq } from '@workspace/db/drizzle';
import { AuditLog, User } from '@workspace/db/schema';
import { cookies, headers } from 'next/headers';

import { env } from '~/env';

export const loginUser = async (user: typeof User.$inferSelect, username: string | null, isNewUser: boolean, skipAuditLog = false) => {
  const headersObj = await headers();
  const ip = headersObj.get('X-Forwarded-For') ?? '';
  const userAgent = headersObj.get('user-agent');

  if (!skipAuditLog) {
    await db.insert(AuditLog).values({
      event: isNewUser ? AUDIT_LOG_USER_CREATED : AUDIT_LOG_LOGIN,
      ip,
      metadata: { username: username },
      userAgent,
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
          ip,
          metadata: { username: username },
          userAgent,
          userId: user.id,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      /* empty */
    }
  }

  const payload = await encodeAuthJWT(user.sessionId, env.JWT_SECRET);
  const cookieStore = await cookies();
  cookieStore.set(LOGIN_COOKIE, payload, {
    httpOnly: true,
    maxAge: JWT_EXPIRES,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
};

export const isAdminUser = async (user?: typeof User.$inferSelect | null): Promise<boolean> => {
  if (!user) {
    user = await authenticatedUserFromRequest();
  }

  if (!user) {
    return false;
  }

  return !!user.isOwner;
};
