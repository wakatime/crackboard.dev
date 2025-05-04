import { TRPCError } from '@trpc/server';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { eq } from '@workspace/db';
import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const usersRouter = createTRPCRouter({
  getUser: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const [user] = await db.select().from(User).where(eq(User.id, input.userId));

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
    }

    return await userToPublicUser(user);
  }),
});
