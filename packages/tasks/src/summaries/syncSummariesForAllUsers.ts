import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';
import { syncUserSummaries } from './syncUserSummaries';

export const syncSummariesForAllUsers = wakaq.task(
  async () => {
    const allUsers = await db.select({ id: User.id }).from(User);
    await Promise.all(allUsers.map((user) => syncUserSummaries.enqueue(user.id)));
  },
  { name: 'getSummaryForAllUsers' },
);
