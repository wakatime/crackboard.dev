import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';
import { syncUserSummaries } from './syncUserSummaries';

export const syncSummariesForAllUsers = wakaq.task(
  async () => {
    const limit = 100;
    let offset = 0;
    let hasMore = true;
    let count = 0;

    while (hasMore) {
      const users = await db.select({ id: User.id }).from(User).limit(limit).offset(offset);

      await Promise.all(users.map((user) => syncUserSummaries.enqueue(user.id)));

      count += users.length;
      offset += limit;
      hasMore = users.length === limit;
    }

    wakaq.logger?.info(`Finished syncing summaries for ${count} users`);
  },
  { name: 'syncSummariesForAllUsers' },
);
