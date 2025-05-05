import { TRPCError } from '@trpc/server';
import { WAKAQ_TASKS_DISABLED_KEY, WAKATIME_API_URI } from '@workspace/core/constants';
import { betterFetch } from '@workspace/core/utils/helpers';
import { db } from '@workspace/db/drizzle';
import { redis } from '@workspace/db/redis';
import { Editor, ProgramLanguage, ProgramLanguageAlias } from '@workspace/db/schema';
import { wakaq } from '@workspace/tasks';
import { registerWithDirectory } from '@workspace/tasks/register/registerWithDirectory';
import { syncSummariesForAllUsers } from '@workspace/tasks/summaries/syncSummariesForAllUsers';
import { syncUserSummaries } from '@workspace/tasks/summaries/syncUserSummaries';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

export const infraRouter = createTRPCRouter({
  syncSummariesForAllUsers: adminProcedure.mutation(async () => {
    await syncSummariesForAllUsers.enqueue();
  }),
  syncUserSummaries: adminProcedure.input(z.object({ userId: z.string() })).mutation(async ({ input: { userId } }) => {
    await syncUserSummaries.enqueue(userId);
  }),
  syncProgramLanguages: adminProcedure.mutation(async () => {
    const url = `${WAKATIME_API_URI}/program_languages`;
    const resp = await betterFetch(url);
    if (resp.status !== 200) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WakaTime API response status ${resp.status}.` });
    }
    const languages = ((await resp.json()) as { data: [{ extensions: string[]; aliases: string[]; color: string | null; name: string }] })
      .data;

    let updated = 0;
    for (const lang of languages) {
      if (lang.name.includes('(') || lang.name.includes('/')) {
        continue;
      }
      const name = lang.name.replaceAll(/[^\w+*#.-]/g, '');
      const programLanguage = await db
        .insert(ProgramLanguage)
        .values({ color: lang.color, name })
        .onConflictDoUpdate({ set: { color: lang.color }, target: ProgramLanguage.name })
        .returning();
      const aliases = await Promise.all(
        lang.aliases.map(async (alias) => {
          return !!(
            await db.insert(ProgramLanguageAlias).values({ id: alias, programLanguageName: name }).onConflictDoNothing().returning()
          )[0];
        }),
      );
      const extensions = await Promise.all(
        lang.extensions.map(async (ext) => {
          return !!(
            await db
              .insert(ProgramLanguageAlias)
              .values({ id: ext.replace('.', ''), programLanguageName: name })
              .onConflictDoNothing()
              .returning()
          )[0];
        }),
      );
      if ((programLanguage.length > 0 || aliases.find((x) => x)) ?? extensions.find((x) => x)) {
        updated += 1;
      }
    }

    return { updated };
  }),
  syncEditors: adminProcedure.mutation(async () => {
    const url = `${WAKATIME_API_URI}/editors`;
    const resp = await betterFetch(url);
    if (resp.status !== 200) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WakaTime API response status ${resp.status}.` });
    }
    const editors = ((await resp.json()) as { data: [{ color: string | null; name: string; website: string | null }] }).data;

    let updated = 0;
    for (const editor of editors) {
      if (editor.name.includes('(') || editor.name.includes('/')) {
        continue;
      }
      const rows = await db
        .insert(Editor)
        .values({ color: editor.color, name: editor.name })
        .onConflictDoUpdate({ set: { color: editor.color }, target: Editor.name })
        .returning();
      if (rows.length > 0) {
        updated += 1;
      }
    }

    return { updated };
  }),
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
  registerWithDirectory: adminProcedure.mutation(async () => {
    await registerWithDirectory.enqueue();
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
