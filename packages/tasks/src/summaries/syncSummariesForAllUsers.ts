import { LEADERBOARD_CONFIG_ID } from '@workspace/core/constants';
import { db, eq } from '@workspace/db/drizzle';
import { LeaderboardConfig, User } from '@workspace/db/schema';

import { wakaq } from '..';
import { syncUserSummaries } from './syncUserSummaries';

export const syncSummariesForAllUsers = wakaq.task(
  async () => {
    const limit = 100;
    let offset = 0;
    let hasMore = true;
    let count = 0;

    while (hasMore) {
      const users = await db.select({ id: User.id }).from(User).limit(limit).offset(offset);

      await Promise.all(users.map((user) => syncUserSummaries.enqueue(user.id)));

      count += users.length;
      offset += limit;
      hasMore = users.length === limit;
    }

    await db.update(LeaderboardConfig).set({ lastSyncedStatsAt: new Date() }).where(eq(LeaderboardConfig.id, LEADERBOARD_CONFIG_ID));
    wakaq.logger?.info(`Finished syncing summaries for ${count} users`);
  },
  { name: 'syncSummariesForAllUsers' },
);
