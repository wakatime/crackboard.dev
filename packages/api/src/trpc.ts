/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { authenticatedUserFromRequest, isAdmin } from '@acme/core/backend/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import type { NextRequest } from 'next/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

export const createTRPCContext = async ({ req }: { req: NextRequest }) => {
  const currentUser = await authenticatedUserFromRequest(req);

  return {
    req,
    currentUser,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
  transformer: superjson,
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

const isAuthedMiddleware = t.middleware(async ({ ctx: { currentUser }, next }) => {
  if (!currentUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx: { currentUser } });
});

export const privateProcedure = t.procedure.use(isAuthedMiddleware);

const isAdminMiddleware = t.middleware(async ({ ctx: { currentUser }, next }) => {
  if (!currentUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (!isAdmin(currentUser)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx: { currentUser } });
});

export const adminProcedure = t.procedure.use(isAdminMiddleware);
