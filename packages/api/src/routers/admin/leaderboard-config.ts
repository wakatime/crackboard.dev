import { getLeaderboardConfig, updateLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { updateLeaderboardConfigSchema } from '@workspace/core/validators';

import { adminProcedure, createTRPCRouter } from '../../trpc';

export const leaderboardConfigRouter = createTRPCRouter({
  getConfig: adminProcedure.query(() => getLeaderboardConfig()),
  updateConfig: adminProcedure.input(updateLeaderboardConfigSchema).mutation(({ input }) => updateLeaderboardConfig(input)),
});
