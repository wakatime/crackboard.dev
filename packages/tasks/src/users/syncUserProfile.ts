import { updateUser } from '@workspace/core/backend/helpers/users';
import { WAKATIME_API_RATE_LIMIT_KEY, WAKATIME_API_URI } from '@workspace/core/constants';
import type { WakaTimeUser } from '@workspace/core/types';
import { betterFetch } from '@workspace/core/utils/helpers';
import { parseJSONObject } from '@workspace/core/validators';
import { db, eq } from '@workspace/db/drizzle';
import { redis } from '@workspace/db/redis';
import { User } from '@workspace/db/schema';
import { Duration } from 'ts-duration';
import { z } from 'zod';

import { wakaq } from '..';

export const syncUserProfile = wakaq.task(
  async (userId: unknown) => {
    const rateLimitKey = WAKATIME_API_RATE_LIMIT_KEY;
    const now = nowSeconds();
    const limitedUntil = await redis.expiretime(rateLimitKey);
    if (limitedUntil > now) {
      const eta = Duration.minute(limitedUntil - now + Math.floor(Math.random() * 10));
      await syncUserProfile.enqueueAfterDelay(eta, userId);
      return;
    }

    const result = z.string().nonempty().safeParse(userId);
    if (!result.success) {
      wakaq.logger?.error(result.error.message);
      return;
    }

    const user = await db.query.User.findFirst({
      where: eq(User.id, result.data),
      columns: { id: true, accessToken: true, refreshToken: true },
    });
    if (!user) {
      wakaq.logger?.error('No user found with id: ', result.data);
      return;
    }

    wakaq.logger?.debug(`Fetching WakaTime profile for user ${user.id}.`);

    const url = `${WAKATIME_API_URI}/users/current`;
    let res: Response;
    try {
      res = await betterFetch(url, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
    } catch (e) {
      wakaq.logger?.error(e);
      return;
    }

    if (res.status !== 200) {
      if (res.status === 429 || res.status >= 500) {
        await redis.setex(rateLimitKey, Duration.minute(1).seconds, '1');
        const eta = Duration.minute(Math.floor(Math.random() * 10));
        await syncUserProfile.enqueueAfterDelay(eta, userId);
        return;
      }
      wakaq.logger?.error('Failed to fetch profile!', await res.text());
      return;
    }

    const wakatimeUser = (parseJSONObject(await res.text()) as { data: WakaTimeUser }).data;
    await updateUser(wakatimeUser);
  },
  { name: 'syncUserProfile' },
);

const nowSeconds = () => Math.round(Date.now() / 1000);
