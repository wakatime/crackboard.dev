import { asDuration } from '@acme/core/backend/duration';
import { redis } from '@acme/db/redis';
import type { Callback, Result } from 'ioredis';
import type { Duration } from 'ts-duration';
import { v4 as uuid } from 'uuid';

const ACQUIRE_LUA = [
  "local result = redis.call('SETNX', KEYS[1], ARGV[1])",
  'if result == 1 then',

  "redis.call('EXPIRE', KEYS[1], ARGV[2])",
  'end',
  'return result',
].join('\n');

const RELEASE_LUA = "if redis.call('GET', KEYS[1]) == ARGV[1] then\nreturn redis.call('DEL', KEYS[1])\nend\nreturn 0";

declare module 'ioredis' {
  interface RedisCommander<Context> {
    acquire(key: string, lockId: string, expires: string, callback?: Callback<string[]>): Result<string[], Context>;
    release(key: string, lockId: string, callback?: Callback<string[]>): Result<string[], Context>;
  }
}

export const acquireLock = async (key: string, expires: number | Duration = 60): Promise<string | undefined> => {
  const lockId = uuid();

  key = `lock${key}`;
  expires = asDuration(expires);

  redis.defineCommand('acquire', {
    lua: ACQUIRE_LUA,
    numberOfKeys: 1,
  });

  const result = (await redis.acquire(key, lockId, String(expires.seconds))) as unknown as number;
  if (result) {
    return lockId;
  }

  return undefined;
};

export const releaseLock = async (key: string, lockId?: string) => {
  key = `lock${key}`;
  if (lockId) {
    redis.defineCommand('release', {
      lua: RELEASE_LUA,
      numberOfKeys: 1,
    });
    await redis.release(key, lockId);
  } else {
    await redis.del(key);
  }
};
