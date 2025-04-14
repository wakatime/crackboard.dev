import type { AppRouter } from '@acme/api';
import { createTRPCReact } from '@trpc/react-query';

export type { RouterInputs, RouterOutputs } from '@acme/api';

export const api = createTRPCReact<AppRouter>();
