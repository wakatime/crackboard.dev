import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@workspace/api';

export type { RouterInputs, RouterOutputs } from '@workspace/api';

export const api = createTRPCReact<AppRouter>();
