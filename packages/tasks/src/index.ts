import { REFRESH_RATE, WAKAQ_TASKS_DISABLED_KEY } from '@workspace/core/constants';
import { redis } from '@workspace/db/redis';
import { Duration } from 'ts-duration';
import { CronTask, Level, WakaQ, WakaQueue } from 'wakaq';
import { PreventTaskExecution } from 'wakaq/dist/exceptions.js';

import { env } from './env';

export const wakaq = new WakaQ({
  beforeTaskStartedCallback: async (_) => {
    if (await redis.exists(WAKAQ_TASKS_DISABLED_KEY)) {
      throw new PreventTaskExecution();
    }
  },
  concurrency: 6,
  hardTimeout: Duration.minute(3),
  host: env.REDIS_HOST,
  password: env.REDIS_PASSWORD,
  port: env.REDIS_PORT ? Number(env.REDIS_PORT) : 6379,
  queues: [new WakaQueue('default')],
  schedules: [
    // runs task (m h dom mon dow)
    new CronTask(`0 */${REFRESH_RATE} * * *`, 'syncSummariesForAllUsers'),
  ],

  workerLogLevel: env.NODE_ENV == 'development' ? Level.DEBUG : undefined,

  //singleProcess: true, // TODO: find out why we don't see all error messages from child workers when using concurrency
  softTimeout: Duration.minute(2),

  tls: env.NODE_ENV == 'production' ? { host: env.REDIS_HOST } : undefined,
  username: env.REDIS_USERNAME,
  waitTimeout: Duration.second(10),
});
