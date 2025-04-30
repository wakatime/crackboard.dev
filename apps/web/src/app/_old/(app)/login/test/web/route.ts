import { createTestDevUser } from '@acme/core/backend/helpers/user';
import { db, eq } from '@acme/db/drizzle';
import { User } from '@acme/db/schema';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '~/env';
import { loginUser } from '~/utils/server-auth';
import { makeUrlSafe } from '~/utils/urlHelpers';

export const GET = async (_req: NextRequest) => {
  if (env.NODE_ENV !== 'development') {
    const user = await db.query.User.findFirst({ where: eq(User.id, 'u_dz4qmd0ugvj1n6mm0ecui9kk') });
    if (!user) {
      return new NextResponse('Not found', { status: 404 });
    }

    await loginUser(user, null, true);
  }

  const user = await createTestDevUser();
  if (!user) {
    return new NextResponse('Not found', { status: 404 });
  }

  await loginUser(user, null, true);

  return NextResponse.redirect(makeUrlSafe('/'));
};
