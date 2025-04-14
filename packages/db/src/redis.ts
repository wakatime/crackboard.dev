import { Redis } from 'ioredis';

import { env } from './env';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    commandTimeout: 15000,
    connectTimeout: 15000,
    db: 0,
    host: env.REDIS_HOST,
    keyPrefix: 'wd',
    lazyConnect: true,
    noDelay: true,
    password: env.REDIS_PASSWORD,
    port: env.REDIS_PORT ? Number(env.REDIS_PORT) : undefined,
    tls: env.NODE_ENV == 'production' ? { host: env.REDIS_HOST } : undefined,
    username: env.REDIS_USERNAME,
  });

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
