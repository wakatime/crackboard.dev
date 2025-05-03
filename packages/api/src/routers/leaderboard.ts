import { TRPCError } from '@trpc/server';
import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { and, db, desc, eq } from '@workspace/db/drizzle';
import { User, UserSummary, UserSummaryEditor, UserSummaryLanguage } from '@workspace/db/schema';
import { format } from 'date-fns';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const leaderboardRouter = createTRPCRouter({
  getLeaders: publicProcedure
    .input(
      z.object({
        date: z.string().date().optional(),
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

      const date = input.date ?? format(new Date(), 'yyyy-MM-dd');

      const leaders = await db
        .select()
        .from(UserSummary)
        .innerJoin(User, eq(User.id, UserSummary.userId))
        .where(eq(UserSummary.date, date))
        .orderBy(desc(UserSummary.totalSeconds))
        .limit(limit)
        .offset(limit * cursor);

      return {
        date,
        items: await Promise.all(
          leaders.map(async (leader) => {
            const [user, languages, editors] = await Promise.all([
              userToPublicUser(leader.User),
              db
                .select()
                .from(UserSummaryLanguage)
                .where(and(eq(UserSummaryLanguage.userId, leader.User.id), eq(UserSummaryLanguage.date, date)))
                .orderBy(desc(UserSummaryLanguage.totalSeconds)),
              db
                .select()
                .from(UserSummaryEditor)
                .where(and(eq(UserSummaryEditor.userId, leader.User.id), eq(UserSummaryEditor.date, date)))
                .orderBy(desc(UserSummaryEditor.totalSeconds)),
            ]);

            return {
              date,
              totalSeconds: leader.UserSummary.totalSeconds,
              user,
              languages,
              editors,
            };
          }),
        ),
        nextCursor: leaders.length >= limit ? cursor + 1 : null,
      };
    }),
});
