import { redis } from '@acme/db/redis';
import type { Integration } from '@acme/db/schema';
import { Duration } from 'ts-duration';

const expiresDefault = Duration.hour(2);

export const get = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<string | null> => {
  return await redis.get(`${task}-${connection.id}-${key}`);
};

export const set = async (
  task: string,
  connection: typeof Integration.$inferSelect,
  key: string,
  val: string,
  expires: Duration = expiresDefault,
): Promise<void> => {
  await redis.setex(`${task}-${connection.id}-${key}`, expires.seconds, val);
};

export const del = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<void> => {
  await redis.del(`${task}-${connection.id}-${key}`);
};

export const bump = async (
  task: string,
  connection: typeof Integration.$inferSelect,
  key: string,
  expires: Duration = expiresDefault,
): Promise<void> => {
  await redis.expire(`${task}-${connection.id}-${key}`, expires.seconds);
};

export const hget = async (
  task: string,
  connection: typeof Integration.$inferSelect,
  key: string,
  subkey: string,
): Promise<string | null> => {
  return await redis.hget(`${task}-${connection.id}-${key}`, subkey);
};

export const hset = async (
  task: string,
  connection: typeof Integration.$inferSelect,
  key: string,
  subkey: string,
  val: string,
  expires: Duration = expiresDefault,
): Promise<void> => {
  await redis.hset(`${task}-${connection.id}-${key}`, subkey, val);
  await redis.expire(`${task}-${connection.id}-${key}`, expires.seconds);
};

export const hlen = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<number> => {
  return await redis.hlen(`${task}-${connection.id}-${key}`);
};

export const lpop = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<string | null> => {
  return await redis.lpop(`${task}-${connection.id}-${key}`);
};

export const rpush = async (task: string, connection: typeof Integration.$inferSelect, key: string, ...values: string[]): Promise<void> => {
  await redis.rpush(`${task}-${connection.id}-${key}`, ...values);
  await redis.expire(`${task}-${connection.id}-${key}`, expiresDefault.seconds);
};

export const lvalues = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<string[]> => {
  return await redis.lrange(`${task}-${connection.id}-${key}`, 0, -1);
};

export const llen = async (task: string, connection: typeof Integration.$inferSelect, key: string): Promise<number> => {
  return await redis.llen(`${task}-${connection.id}-${key}`);
};

export const incr = async (
  task: string,
  connection: typeof Integration.$inferSelect,
  key: string,
  increment = 1,
  expires: Duration = expiresDefault,
): Promise<void> => {
  await redis.incrby(`${task}-${connection.id}-${key}`, increment);
  await redis.expire(`${task}-${connection.id}-${key}`, expires.seconds);
};
