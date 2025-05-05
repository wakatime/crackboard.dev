import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';
import { syncUserProfile } from './syncUserProfile';

export const syncUserProfilesForAllUsers = wakaq.task(
  async () => {
    const limit = 100;
    let offset = 0;
    let hasMore = true;
    let count = 0;

    while (hasMore) {
      const users = await db.select({ id: User.id }).from(User).limit(limit).offset(offset);

      await Promise.all(users.map((user) => syncUserProfile.enqueue(user.id)));

      count += users.length;
      offset += limit;
      hasMore = users.length === limit;
    }

    wakaq.logger?.info(`Finished syncing profiles for ${count} users`);
  },
  { name: 'syncUserProfilesForAllUsers' },
);
