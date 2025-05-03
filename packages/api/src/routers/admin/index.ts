import { createTRPCRouter } from '../../trpc';
import { infraRouter } from './infra';

export const adminRouter = createTRPCRouter({
  infra: infraRouter,
});
