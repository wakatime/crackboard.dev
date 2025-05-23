import { createId } from '@paralleldrive/cuid2';
import { db, eq } from '@workspace/db/drizzle';
import { LeaderboardConfig } from '@workspace/db/schema';

import { LEADERBOARD_CONFIG_ID } from '../../constants';
import type { UpdateLeaderboardConfigData } from '../../validators';

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
  const updated = await db.transaction(async (tx) => {
    const wasInviteOnly =
      (
        await tx
          .select({ isInviteOnly: LeaderboardConfig.isInviteOnly })
          .from(LeaderboardConfig)
          .where(eq(LeaderboardConfig.id, LEADERBOARD_CONFIG_ID))
          .limit(1)
      )[0]?.isInviteOnly ?? false;
    const [updatedConfig] = await tx
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
    if (updatedConfig && options.isInviteOnly && !wasInviteOnly) {
      await tx
        .update(LeaderboardConfig)
        .set({ inviteCode: `i_${createId()}` })
        .where(eq(LeaderboardConfig.id, updatedConfig.id));
    }
    return updatedConfig;
  });

  if (!updated) {
    throw new Error('Failed to update config!');
  }

  return updated;
};
