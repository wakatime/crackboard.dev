import { APP_NAME, WAKATIME_API_URI } from '@workspace/core/constants';
import { db, eq, sql } from '@workspace/db/drizzle';
import { User, UserSummary, UserSummaryEditor, UserSummaryLanguage } from '@workspace/db/schema';
import { endOfToday, endOfYesterday, startOfToday, startOfYesterday } from 'date-fns';
import { z } from 'zod';

import { wakaq } from '..';
import type { SummariesResult } from '../types';

async function syncUserSummary(user: typeof User.$inferSelect, start: Date, end: Date) {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: 'UTC',
  });

  const res = await fetch(`${WAKATIME_API_URI}/users/current/summaries?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': APP_NAME,
    },
  });

  if (res.status !== 200) {
    wakaq.logger?.error('Failed to fetch summary!', await res.text());
    return;
  }

  const summeriesResult = (await res.json()) as SummariesResult;

  const summary = summeriesResult.data[0];
  if (!summary) {
    return;
  }

  await db
    .insert(UserSummary)
    .values({
      date: summary.range.date,
      userId: user.id,
      totalSeconds: summary.grand_total.total_seconds,
    })
    .onConflictDoUpdate({
      target: [UserSummary.date, UserSummary.userId],
      set: {
        // excluded is a special reference that refer to the row that was proposed for insertion, but wasn’t inserted because of the conflict.
        totalSeconds: sql.raw(`excluded.${UserSummary.totalSeconds.name}`),
      },
    });

  const languageSummaryValues = summary.languages.map(
    (stat) =>
      ({
        date: summary.range.date,
        userId: user.id,
        programLanguageName: stat.name,
        totalSeconds: stat.total_seconds,
      }) satisfies typeof UserSummaryLanguage.$inferInsert,
  );

  if (languageSummaryValues.length > 0) {
    await db
      .insert(UserSummaryLanguage)
      .values(languageSummaryValues)
      .onConflictDoUpdate({
        target: [UserSummaryLanguage.date, UserSummaryLanguage.userId, UserSummaryLanguage.programLanguageName],
        set: {
          totalSeconds: sql.raw(`excluded.${UserSummaryLanguage.totalSeconds.name}`),
        },
      });
  }

  const editorSummaryValues = summary.editors.map(
    (stat) =>
      ({
        date: summary.range.date,
        userId: user.id,
        editorName: stat.name,
        totalSeconds: stat.total_seconds,
      }) satisfies typeof UserSummaryEditor.$inferInsert,
  );

  if (editorSummaryValues.length > 0) {
    await db
      .insert(UserSummaryEditor)
      .values(editorSummaryValues)
      .onConflictDoUpdate({
        target: [UserSummaryEditor.date, UserSummaryEditor.userId, UserSummaryEditor.editorName],
        set: {
          totalSeconds: sql.raw(`excluded.${UserSummaryEditor.totalSeconds.name}`),
        },
      });
  }
}

export const getUserSummary = wakaq.task(
  async (userId: unknown) => {
    const result = z.string().nonempty().safeParse(userId);

    if (!result.success) {
      wakaq.logger?.error(result.error.message);
      return;
    }

    const [user] = await db.select().from(User).where(eq(User.id, result.data));

    if (!user) {
      wakaq.logger?.error('No user found with id: ', result.data);
      return;
    }

    wakaq.logger?.debug(`Fetching WakaTime summaries for user ${user.id}.`);

    await syncUserSummary(user, startOfToday(), endOfToday());
    await syncUserSummary(user, startOfYesterday(), endOfYesterday());
  },
  { name: 'getUserSummary' },
);
