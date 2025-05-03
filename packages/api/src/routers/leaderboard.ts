import { TRPCError } from '@trpc/server';
import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { db, desc, eq } from '@workspace/db/drizzle';
import { User, UserSummary } from '@workspace/db/schema';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const leaderboardRouter = createTRPCRouter({
  getLeaders: publicProcedure
    .input(
      z.object({
        cursor: z.number().positive().nullish(),
        limit: z.number().positive().min(1).optional(),
      }),
    )
    .query(async ({ ctx: { currentUser }, input }) => {
      const config = await getLeaderboardConfig();
      if (!config.isPublic && !currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const limit = input.limit ?? 20;
      const cursor = input.cursor ?? 0;

      const now = new Date();
      const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      const leaders = await db
        .select()
        .from(UserSummary)
        .innerJoin(User, eq(User.id, UserSummary.userId))
        .where(eq(UserSummary.date, date))
        .orderBy(desc(UserSummary.totalSeconds))
        .limit(limit)
        .offset(limit * cursor);

      return {
        items: await Promise.all(
          leaders.map(async (leader) => ({
            data: leader.UserSummary.date,
            totalSeconds: leader.UserSummary.totalSeconds,
            user: await userToPublicUser(leader.User),
          })),
        ),
        nextCursor: leaders.length >= limit ? cursor + 1 : null,
      };
    }),
});
