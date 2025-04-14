'use client';

import { CSRF_COOKIE, CSRF_TOKEN_HEADER } from '@acme/core/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { getCookie } from 'cookies-next';
import type { ReactNode } from 'react';
import { useState } from 'react';
import superjson from 'superjson';

import { env } from '~/env';
import { api } from '~/trpc/client';

export default function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } }));
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) => env.NODE_ENV === 'development' || (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchLink({
          headers: async () => {
            const headers = new Map<string, string>();
            headers.set('x-trpc-source', 'nextjs-react');
            const token = await getCookie(CSRF_COOKIE);
            if (token) {
              headers.set(CSRF_TOKEN_HEADER, token);
            }
            return Object.fromEntries(headers);
          },
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    }),
  );
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
