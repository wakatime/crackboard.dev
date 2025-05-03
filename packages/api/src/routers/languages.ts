import { db } from '@workspace/db/drizzle';
import { ProgramLanguage } from '@workspace/db/schema';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const languagesRouter = createTRPCRouter({
  getAllProgramLanguages: publicProcedure.query(async () => {
    return await db.select().from(ProgramLanguage).orderBy(ProgramLanguage.name);
  }),
});
