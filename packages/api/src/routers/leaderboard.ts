import { TRPCError } from '@trpc/server';
import { GitHash } from '@workspace/core/backend/git-hash';
import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { REFRESH_RATE } from '@workspace/core/constants';
import { today } from '@workspace/core/utils/helpers';
import { and, count, db, desc, eq, gt, gte, sql } from '@workspace/db/drizzle';
import { User, UserSummary, UserSummaryEditor, UserSummaryLanguage } from '@workspace/db/schema';
import { syncSummariesForAllUsers } from '@workspace/tasks/summaries/syncSummariesForAllUsers';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const leaderboardRouter = createTRPCRouter({
  getLeaders: publicProcedure
    .input(
      z.object({
        date: z.string().date().optional(),
        page: z.number().positive().min(1).nullish(),
        limit: z.number().positive().min(1).max(500).optional(),
      }),
    )
    .query(async ({ ctx: { currentUser }, input }) => {
      const config = await getLeaderboardConfig();
      if (!config.isPublic && !currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const limit = input.limit ?? 500;
      const page = input.page ?? 1;

      const date = input.date ?? today();

      const Languages = db.$with('UserSummaryLanguage').as(
        db
          .select({
            count: sql<number>`count(${UserSummaryLanguage.programLanguageName})`.as('count'),
            userId: UserSummaryLanguage.userId,
          })
          .from(UserSummaryLanguage)
          .where(and(eq(UserSummaryLanguage.date, date), gte(UserSummaryLanguage.totalSeconds, 60)))
          .groupBy(UserSummaryLanguage.userId),
      );

      const leaders = await db
        .with(Languages)
        .select()
        .from(UserSummary)
        .innerJoin(User, eq(User.id, UserSummary.userId))
        .leftJoin(Languages, eq(Languages.userId, UserSummary.userId))
        .where(and(eq(UserSummary.date, date), gt(UserSummary.totalSeconds, 60), gt(Languages.count, 0)))
        .orderBy(desc(UserSummary.totalSeconds))
        .limit(limit)
        .offset(limit * (page - 1));

      const items = await Promise.all(
        leaders.map(async (leader) => {
          const [user, languages, editors] = await Promise.all([
            userToPublicUser(leader.User),
            db
              .select()
              .from(UserSummaryLanguage)
              .where(
                and(
                  eq(UserSummaryLanguage.userId, leader.User.id),
                  eq(UserSummaryLanguage.date, date),
                  gte(UserSummaryLanguage.totalSeconds, 60),
                ),
              )
              .orderBy(desc(UserSummaryLanguage.totalSeconds))
              .limit(3),
            db
              .select()
              .from(UserSummaryEditor)
              .where(
                and(
                  eq(UserSummaryEditor.userId, leader.User.id),
                  eq(UserSummaryEditor.date, date),
                  gte(UserSummaryEditor.totalSeconds, 60),
                ),
              )
              .orderBy(desc(UserSummaryEditor.totalSeconds))
              .limit(3),
          ]);

          return {
            date,
            totalSeconds: leader.UserSummary.totalSeconds,
            user,
            languages,
            editors,
          };
        }),
      );

      const totalCount = await db
        .with(Languages)
        .select({ count: count() })
        .from(UserSummary)
        .leftJoin(Languages, eq(Languages.userId, UserSummary.userId))
        .where(and(eq(UserSummary.date, date), gt(UserSummary.totalSeconds, 60), gt(Languages.count, 0)))
        .then((res) => res[0]?.count ?? 0);

      if (totalCount === 0) {
        await syncSummariesForAllUsers.enqueue();
      }

      return {
        date,
        items,
        limit,
        page,
        prevPage: page > 2 ? page - 1 : null,
        nextPage: leaders.length >= limit ? page + 1 : null,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        timezone: config.timezone,
      };
    }),
  getLeaderboardPublicConfig: publicProcedure.query(async () => {
    const config = await getLeaderboardConfig();
    const numMembers = await db
      .select({ count: count() })
      .from(User)
      .then((res) => res[0]?.count ?? 0);
    const hash = await GitHash();
    return {
      timezone: config.timezone,
      isPublic: config.isPublic,
      isInviteOnly: config.isInviteOnly,
      commitSha: hash,
      createdAt: config.createdAt,
      numMembers,
      refreshRateInHours: REFRESH_RATE,
      lastRefreshedAt: config.lastSyncedStatsAt,
    };
  }),
});
