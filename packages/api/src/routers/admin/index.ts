import { createTRPCRouter } from '../../trpc';
import { infraRouter } from './infra';
import { leaderboardConfigRouter } from './leaderboard-config';
import { tasksRouter } from './tasks';
import { usersRouter } from './users';

export const adminRouter = createTRPCRouter({
  infra: infraRouter,
  leaderboardConfig: leaderboardConfigRouter,
  tasks: tasksRouter,
  users: usersRouter,
});
