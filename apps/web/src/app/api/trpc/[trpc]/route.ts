import { appRouter, createTRPCContext } from '@acme/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

import { env } from '~/env';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    createContext: () => createTRPCContext({ req }),
    endpoint: '/api/trpc',
    onError:
      env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
          }
        : undefined,
    req,
    router: appRouter,
  });

export { handler as GET, handler as POST };
