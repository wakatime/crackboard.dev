import { TRPCError } from '@trpc/server';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { updateUserSchema } from '@workspace/core/validators';
import { eq } from '@workspace/db';
import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';
import { z } from 'zod';

import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc';

export const usersRouter = createTRPCRouter({
  getUser: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const [user] = await db.select().from(User).where(eq(User.id, input.userId));

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
    }

    return userToPublicUser(user);
  }),
  updateUser: privateProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
    const [updatedUser] = await db
      .update(User)
      .set({ fullName: input.name, bio: input.bio })
      .where(eq(User.id, ctx.currentUser.id))
      .returning();
    if (!updatedUser) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
    return userToPublicUser(updatedUser);
  }),
});
