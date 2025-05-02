import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';
import { chunkify } from '../utils/helpers';
import { getUserSummary } from './getUserSummary';

export const getSummaryForAllUsers = wakaq.task(
  async () => {
    const allUsers = await db.select({ id: User.id }).from(User);
    const chunks = chunkify(allUsers, 20);
    for (const chunk of chunks) {
      await Promise.all(chunk.map((user) => getUserSummary.enqueue(user.id)));
    }
  },
  { name: 'getSummaryForAllUsers' },
);
