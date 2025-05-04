import { redis } from '@workspace/db/redis';
import { Duration } from 'ts-duration';

export const incrementRateLimitCounter = async (key: string, expires = Duration.hour(1)) => {
  const count = await redis.incr(key);
  await redis.expire(key, expires.seconds);
  return count;
};

export const getRateLimitCounter = async (key: string) => {
  try {
    return parseInt((await redis.get(key)) ?? '0');
  } catch (e) {
    console.error(e);
    return 0;
  }
};

export const isRateLimited = async (key: string, limit = 20, currentCount: number | undefined = undefined) => {
  const count = currentCount !== undefined ? currentCount : await getRateLimitCounter(key);
  return count > limit;
};
