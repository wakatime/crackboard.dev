import { db, eq } from '@workspace/db/drizzle';
import { LeaderboardConfig } from '@workspace/db/schema';

import type { UpdateLeaderboardConfigData } from '../../validators';

const LEADERBOARD_CONFIG_ID = 'leaderboard-config';

export const getLeaderboardConfig = async () => {
  const config = await db.transaction(async (tx) => {
    const [config] = await tx.select().from(LeaderboardConfig).where(eq(LeaderboardConfig.id, LEADERBOARD_CONFIG_ID));
    if (config) {
      return config;
    }
    const [newConfig] = await tx.insert(LeaderboardConfig).values({ id: LEADERBOARD_CONFIG_ID }).returning();
    if (!newConfig) {
      return (await tx.select().from(LeaderboardConfig).where(eq(LeaderboardConfig.id, LEADERBOARD_CONFIG_ID)))[0];
    }
    return newConfig;
  });
  if (!config) {
    throw new Error('Failed to get config!');
  }
  return config;
};

export const updateLeaderboardConfig = async (options: UpdateLeaderboardConfigData) => {
  const [updatedConfig] = await db
    .insert(LeaderboardConfig)
    .values({
      id: LEADERBOARD_CONFIG_ID,
      ...options,
    })
    .onConflictDoUpdate({
      target: LeaderboardConfig.id,
      set: {
        ...options,
      },
    })
    .returning();

  if (!updatedConfig) {
    throw new Error('Failed to update config!');
  }

  return updatedConfig;
};
