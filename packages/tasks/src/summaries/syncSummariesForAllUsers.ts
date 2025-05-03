import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';
import { chunkify } from '../utils/helpers';
import { syncUserSummaries } from './syncUserSummaries';

export const syncSummariesForAllUsers = wakaq.task(
  async () => {
    const allUsers = await db.select({ id: User.id }).from(User);
    const chunks = chunkify(allUsers, 20);
    for (const chunk of chunks) {
      await Promise.all(chunk.map((user) => syncUserSummaries.enqueue(user.id)));
    }
  },
  { name: 'getSummaryForAllUsers' },
);
