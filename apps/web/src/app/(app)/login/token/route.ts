import { and, db, eq, gt } from '@acme/db/drizzle';
import { AdminUserLoginToken, User } from '@acme/db/schema';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { loginUser } from '~/utils/server-auth';
import { makeUrlSafe } from '~/utils/urlHelpers';

export const GET = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token');
  const userId = req.nextUrl.searchParams.get('user');

  if (!token || !userId) {
    return new NextResponse('Not found', { status: 404 });
  }

  const user = await db.query.User.findFirst({ where: eq(User.id, userId) });
  if (!user) {
    return new NextResponse('Not found', { status: 404 });
  }

  const t = await db.query.AdminUserLoginToken.findFirst({
    where: and(eq(AdminUserLoginToken.id, token), eq(AdminUserLoginToken.userId, user.id), gt(AdminUserLoginToken.expiresAt, new Date())),
  });
  if (!t) {
    return new NextResponse('Not found', { status: 404 });
  }

  await loginUser(user, null, false, true);
  await db
    .update(AdminUserLoginToken)
    .set({ usedCount: t.usedCount + 1 })
    .where(eq(AdminUserLoginToken.id, t.id));

  return NextResponse.redirect(makeUrlSafe('/'));
};
