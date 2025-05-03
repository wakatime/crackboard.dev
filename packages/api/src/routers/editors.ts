import { db } from '@workspace/db/drizzle';
import { Editor } from '@workspace/db/schema';

import { createTRPCRouter, publicProcedure } from '../trpc';

export const editorsRouter = createTRPCRouter({
  getAllEditors: publicProcedure.query(async () => {
    return await db.select().from(Editor).orderBy(Editor.name);
  }),
});
