import { TRPCError } from '@trpc/server';
import { WAKAQ_TASKS_DISABLED_KEY } from '@workspace/core/constants';
import { redis } from '@workspace/db/redis';
import { wakaq } from '@workspace/tasks';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

export const tasksRouter = createTRPCRouter({
  getTask: adminProcedure.input(z.string()).query(({ input }) => {
    const task = Array.from(wakaq.tasks.values()).find((task) => task.name === input);
    if (!task) {
      return undefined;
    }
    const m = task.fn.toString().match(/async\s*\(([^)]*)\)\s*=>/g);
    const m2 = task.fn.toString().match(/async\s*([^=]*)\s*=>/g);
    const match = m ?? m2;
    const args = match?.[1] ? match[1].split(',') : [];
    return { args, name: task.name };
  }),
  getTasksEnabledStatus: adminProcedure.query(async () => {
    return !!(await redis.exists(WAKAQ_TASKS_DISABLED_KEY));
  }),
  setTasksEnabledStatus: adminProcedure.input(z.object({ isDisabled: z.boolean() })).mutation(async ({ input: { isDisabled } }) => {
    if (isDisabled) {
      await redis.set(WAKAQ_TASKS_DISABLED_KEY, '1');
    } else {
      await redis.del(WAKAQ_TASKS_DISABLED_KEY);
    }
  }),
  searchTasks: adminProcedure.input(z.object({ q: z.string() })).query(({ input }) => {
    const { q } = input;
    const tasks = Array.from(wakaq.tasks.values())
      .filter((task) => !q || task.name.toLowerCase().includes(q.toLowerCase()))
      .map((task) => {
        const m = /async\s*\(([^)]*)\)\s*=>/.exec(task.fn.toString());
        const m2 = /async\s*([^=]*)\s*=>/.exec(task.fn.toString());
        const match = m ?? m2;
        const args = match?.[1] ? match[1].split(',') : [];
        return { args, name: task.name };
      });
    return {
      tasks: tasks,
      total: tasks.length,
    };
  }),
  executeBackgroundTask: adminProcedure
    .input(z.object({ args: z.array(z.any()), inForeground: z.boolean().optional(), task: z.string() }))
    .mutation(async ({ input }) => {
      const { task: taskName, args } = input;
      const task = Array.from(wakaq.tasks.values()).find((task) => task.name === taskName);
      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Task not found: ${taskName}` });
      }
      if (input.inForeground) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await task.fn(...args);
      } else {
        await wakaq.enqueueAtEnd(task.name, args);
      }
    }),
});
