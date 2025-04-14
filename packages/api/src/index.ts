import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { adminRouter } from './routers/admin';
import { analyticsRouter } from './routers/analytics';
import { authRouter } from './routers/auth';
import { chatRouter } from './routers/chat';
import { companiesRouter } from './routers/companies';
import { imagesRouter } from './routers/images';
import { integrationsRouter } from './routers/integrations';
import { jobsRouter } from './routers/jobs';
import { leadersRouter } from './routers/leaders';
import { listRouter } from './routers/list';
import { notificationsRouter } from './routers/notifications';
import { pollsRouter } from './routers/polls';
import { postsRouter } from './routers/posts';
import { reactionsRouter } from './routers/reactions';
import { searchRouter } from './routers/search';
import { securityEventsRouter } from './routers/security-events';
import { sharedRouter } from './routers/shared';
import { tabsRouter } from './routers/tabs';
import { threadsRouter } from './routers/threads';
import { timelineRouter } from './routers/timeline';
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
  analytics: analyticsRouter,
  auth: authRouter,
  chat: chatRouter,
  images: imagesRouter,
  integrations: integrationsRouter,
  leaders: leadersRouter,
  list: listRouter,
  notifications: notificationsRouter,
  polls: pollsRouter,
  posts: postsRouter,
  reactions: reactionsRouter,
  search: searchRouter,
  tabs: tabsRouter,
  threads: threadsRouter,
  timeline: timelineRouter,
  users: usersRouter,
  securityEvents: securityEventsRouter,
  companies: companiesRouter,
  jobs: jobsRouter,
  shared: sharedRouter,
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
