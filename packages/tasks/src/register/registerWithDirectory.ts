import { APP_NAME, WAKATIME_API_URI } from '@workspace/core/constants';
import { betterFetch } from '@workspace/core/utils/helpers';
import { count, db, eq } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { wakaq } from '..';

export const registerWithDirectory = wakaq.task(
  async () => {
    const [user] = await db.select().from(User).where(eq(User.isOwner, true));
    if (!user) {
      wakaq.logger?.error('No owner found for this crackboard, unable to register with directory.');
      return;
    }

    const numMembers = await db
      .select({ count: count() })
      .from(User)
      .then((res) => res[0]?.count ?? 0);

    wakaq.logger?.debug(`Registering with WakaTime directory: ${numMembers} members`);

    const url = `${WAKATIME_API_URI}/crackboards`;
    const res = await betterFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({
        domain: APP_NAME,
        num_members: numMembers,
      }),
    });

    if (res.status !== 200 && res.status !== 201) {
      wakaq.logger?.error('Failed to register with WakaTime directory:', await res.text());
      return;
    }
  },
  { name: 'registerWithDirectory' },
);
