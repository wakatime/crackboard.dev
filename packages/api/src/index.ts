import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { leaderboardRouter } from './routers/leaderboard';
import { usersRouter } from './routers/users';
import { createTRPCRouter } from './trpc';

export { createTRPCContext } from './trpc';
export type { TRPCError } from '@trpc/server';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  users: usersRouter,
  leaderboard: leaderboardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
