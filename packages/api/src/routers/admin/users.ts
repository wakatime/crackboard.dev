import { TRPCError } from '@trpc/server';
import { pagify } from '@workspace/core/utils/helpers';
import { count, db, desc, eq, ilike, or } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

export const usersRouter = createTRPCRouter({
  deleteUser: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    const user = await db.query.User.findFirst({ where: eq(User.id, input) });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
    }

    try {
      const deleted = (await db.delete(User).where(eq(User.id, user.id)).returning({ id: User.id }))[0]?.id;
      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }
    } catch (e) {
      console.error(e);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(e) });
    }
  }),
  searchUsers: adminProcedure.input(z.object({ page: z.number(), q: z.string() })).query(async ({ input }) => {
    const { page, q } = input;
    const filter = q ? or(ilike(User.username, `%${q}%`), eq(User.id, q)) : undefined;
    const total = (await db.select({ value: count() }).from(User).where(filter))[0]?.value ?? 0;
    const resp = pagify(total, page);
    return {
      users: await db.query.User.findMany({
        limit: resp.limit,
        offset: resp.offset,
        orderBy: [desc(User.createdAt)],
        where: filter,
        columns: {
          id: true,
          createdAt: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          wonderfulDevUsername: true,
          isOwner: true,
          lastSyncedStatsAt: true,
        },
      }),
      ...resp,
    };
  }),
  getUser: adminProcedure.input(z.string()).query(async ({ input }) => {
    const user = await db.query.User.findFirst({
      where: eq(User.id, input),
      columns: {
        id: true,
        createdAt: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        wonderfulDevUsername: true,
        isOwner: true,
        lastSyncedStatsAt: true,
      },
    });
    if (!user) {
      return null;
    }

    return user;
  }),
});
