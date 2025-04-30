import { userToPublicUser } from '@acme/core/backend/helpers/users';
import { eq } from '@acme/db';
import { db } from '@acme/db/drizzle';
import { User } from '@acme/db/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const usersRouter = createTRPCRouter({
  getUser: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const [user] = await db.select().from(User).where(eq(User.id, input.userId));

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
    }

    const pubUser = await userToPublicUser(user);

    return pubUser;
  }),
});
