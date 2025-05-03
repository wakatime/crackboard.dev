import { createTRPCRouter } from '../../trpc';
import { infraRouter } from './infra';
import { leaderboardConfigRouter } from './leaderboard-config';

export const adminRouter = createTRPCRouter({
  infra: infraRouter,
  leaderboardConfig: leaderboardConfigRouter,
});
