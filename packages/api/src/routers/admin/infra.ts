import { TRPCError } from '@trpc/server';
import { db } from '@workspace/db/drizzle';
import { Editor, ProgramLanguage, ProgramLanguageAlias } from '@workspace/db/schema';
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
    const url = 'https://wakatime.com/api/v1/program_languages';
    const resp = await fetch(url);
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
    const url = 'https://wakatime.com/api/v1/editors';
    const resp = await fetch(url);
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
});
