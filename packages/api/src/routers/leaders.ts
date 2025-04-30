import { createTRPCRouter } from '../trpc';

export const leadersRouter = createTRPCRouter({
  // getIntegrationsWithLeaders: publicProcedure.query(async ({ ctx: { currentUser } }) => {
  //   return (
  //     await Promise.all(
  //       integrations.map(async (i) => {
  //         const provider = i.id;
  //         const UserIntegrations = db.$with('UserIntegrations').as(
  //           db
  //             .select({
  //               totalScore: sql<number>`cast(sum(${Integration.providerAccountScoreRaw}) as int)`.as('totalScore'),
  //               userId: Integration.userId,
  //             })
  //             .from(Integration)
  //             .where(eq(Integration.provider, provider))
  //             .groupBy(Integration.userId),
  //         );
  //         const users = await db
  //           .with(UserIntegrations)
  //           .select({ totalScore: UserIntegrations.totalScore, user: User })
  //           .from(User)
  //           .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
  //           .where(and(isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0)))
  //           .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
  //           .limit(3);
  //         return {
  //           id: provider,
  //           integration: i,
  //           users: await Promise.all(
  //             users.map(async (row) => {
  //               return {
  //                 ...badgeInfoForProviderScore(provider, row.totalScore),
  //                 totalScore: row.totalScore,
  //                 user: await userToPublicUser(row.user, currentUser?.id),
  //               };
  //             }),
  //           ),
  //         };
  //       }),
  //     )
  //   ).sort((a, b) => (b.users[0]?.totalScore ?? -1) - (a.users[0]?.totalScore ?? -1));
  // }),
  // getLanguagesWithLeaders: publicProcedure.query(async ({ ctx: { currentUser } }) => {
  //   const programLanguages = await db.select().from(ProgramLanguage);
  //   return await Promise.all(
  //     programLanguages.map(async (language) => {
  //       const UserBadges = db.$with('UserBadges').as(
  //         db
  //           .select({
  //             provider: ProgramLanguageBadge.provider,
  //             totalScore: sql<number>`cast(sum(${ProgramLanguageBadge.score}) as int)`.as('totalScore'),
  //             userId: ProgramLanguageBadge.userId,
  //           })
  //           .from(ProgramLanguageBadge)
  //           .where(eq(ProgramLanguageBadge.programLanguageName, language.name))
  //           .groupBy(ProgramLanguageBadge.userId, ProgramLanguageBadge.provider),
  //       );
  //       const users = await db
  //         .with(UserBadges)
  //         .select({ provider: UserBadges.provider, totalScore: UserBadges.totalScore, user: User })
  //         .from(User)
  //         .innerJoin(UserBadges, eq(User.id, UserBadges.userId))
  //         .where(and(isNotNull(UserBadges.userId), gt(UserBadges.totalScore, 0)))
  //         .orderBy(desc(UserBadges.totalScore), desc(User.createdAt))
  //         .limit(3);
  //       return {
  //         id: language.name,
  //         language,
  //         users: await Promise.all(
  //           users.map(async (row) => {
  //             return {
  //               ...badgeInfoForProviderScore(row.provider, row.totalScore),
  //               totalScore: row.totalScore,
  //               user: await userToPublicUser(row.user, currentUser?.id),
  //             };
  //           }),
  //         ),
  //       };
  //     }),
  //   );
  // }),
  // topUsersForIntegration: publicProcedure
  //   .input(
  //     z.object({
  //       cursor: z.number().int().min(0).max(999).default(0),
  //       filter: leadersFilterOptions.optional(),
  //       provider: z.nativeEnum(IntegrationIdentifier).nullish(),
  //     }),
  //   )
  //   .query(async ({ input: { provider, cursor, filter }, ctx: { currentUser } }) => {
  //     if (!provider) {
  //       return {
  //         items: [],
  //         nextCursor: undefined,
  //       };
  //     }
  //     const limit = 10;
  //     if (currentUser) {
  //       await updateLastViewedTimestamp(currentUser, 'lastViewedLeadersSubpageAt');
  //     }
  //     const query = await getLeadersForProviderQuery(provider, filter as { languages?: string[] | undefined } | undefined, limit, cursor);
  //     const items = await Promise.all(
  //       query.map(async (row) => {
  //         const pubUser = await userToPublicUser(row.user, currentUser?.id);
  //         return {
  //           ...pubUser,
  //           ...badgeInfoForProviderScore(provider, row.totalScore),
  //         };
  //       }),
  //     );
  //     return {
  //       items: items,
  //       nextCursor: items.length == limit ? cursor + 1 : undefined,
  //     };
  //   }),
  // topUsersForLanguage: publicProcedure
  //   .input(
  //     z.object({
  //       cursor: z.number().int().min(0).max(999).default(0),
  //       languageName: z.string(),
  //     }),
  //   )
  //   .query(async ({ input: { languageName, cursor }, ctx: { currentUser } }) => {
  //     if (!languageName) {
  //       return {
  //         items: [],
  //         nextCursor: undefined,
  //       };
  //     }
  //     const limit = 10;
  //     if (currentUser) {
  //       await updateLastViewedTimestamp(currentUser, 'lastViewedLeadersSubpageAt');
  //     }
  //     const query = await getLeadersForLanguageQuery(languageName, limit, cursor);
  //     const items = await Promise.all(query.map((row) => userToPublicUser(row.user, currentUser?.id)));
  //     return {
  //       items: items,
  //       nextCursor: items.length == limit ? cursor + 1 : undefined,
  //     };
  //   }),
});
