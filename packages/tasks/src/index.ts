import { WAKAQ_TASKS_DISABLED_KEY } from '@workspace/core/constants';
import { redis } from '@workspace/db/redis';
import { Duration } from 'ts-duration';
import { CronTask, Level, WakaQ, WakaQueue } from 'wakaq';
import { PreventTaskExecution } from 'wakaq/dist/exceptions.js';

export const wakaq = new WakaQ({
  beforeTaskStartedCallback: async (_) => {
    if (await redis.exists(WAKAQ_TASKS_DISABLED_KEY)) {
      throw new PreventTaskExecution();
    }
  },
  concurrency: 6,
  hardTimeout: Duration.minute(3),
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  queues: [new WakaQueue('default')],
  schedules: [
    // runs task (m h dom mon dow)
    new CronTask('0 0 * * *', 'syncUserInfoForAllUsers'),
    new CronTask('0 12 1 * *', 'scrapeIntegrationForAllUsers'),
    // new CronTask('0 0 * * *', 'syncIntegrationTimelineForAllUsers'),
    new CronTask('0 0 * * *', 'populateSuggestFollowUsersTable'),
    new CronTask('0 * * * *', 'refreshTrendingPosts'),
  ],

  workerLogLevel: process.env.NODE_ENV == 'development' ? Level.DEBUG : undefined,

  //singleProcess: true, // TODO: find out why we don't see all error messages from child workers when using concurrency
  softTimeout: Duration.minute(2),

  tls: process.env.NODE_ENV == 'production' ? { host: process.env.REDIS_HOST } : undefined,
  username: process.env.REDIS_USERNAME,
  waitTimeout: Duration.second(10),
});
