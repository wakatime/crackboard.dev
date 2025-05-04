import { WAKATIME_API_URI } from '@workspace/core/constants';
import { betterFetch } from '@workspace/core/utils/helpers';
import { db, eq } from '@workspace/db/drizzle';
import { User, UserSummary, UserSummaryEditor, UserSummaryLanguage } from '@workspace/db/schema';
import { differenceInMinutes } from 'date-fns';
import { z } from 'zod';

import { wakaq } from '..';
import type { SummariesResult, Summary } from '../types';

async function _syncUserSummary(user: { id: string; accessToken: string; lastSyncedStatsAt: Date | null }) {
  const params = new URLSearchParams({
    range: 'Last 7 Days',
    timezone: 'UTC',
  });
  const url = `${WAKATIME_API_URI}/users/current/summaries?${params.toString()}`;
  const res = await betterFetch(url, {
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (res.status !== 200) {
    wakaq.logger?.error('Failed to fetch summary!', await res.text());
    return;
  }

  const summaries = ((await res.json()) as SummariesResult).data;

  await Promise.all(summaries.map((summary) => _processSummary(user, summary)));

  await db.update(User).set({ lastSyncedStatsAt: new Date() }).where(eq(User.id, user.id));
}

async function _processSummary(user: { id: string; accessToken: string; lastSyncedStatsAt: Date | null }, summary: Summary) {
  await db
    .insert(UserSummary)
    .values({
      date: summary.range.date,
      userId: user.id,
      totalSeconds: Math.floor(summary.grand_total.total_seconds),
    })
    .onConflictDoUpdate({
      target: [UserSummary.date, UserSummary.userId],
      set: {
        totalSeconds: Math.floor(summary.grand_total.total_seconds),
      },
    });

  await Promise.all(
    summary.languages.map(async (stat) => {
      if (stat.name === 'Other') {
        return;
      }
      try {
        await db
          .insert(UserSummaryLanguage)
          .values({
            date: summary.range.date,
            userId: user.id,
            programLanguageName: stat.name,
            totalSeconds: Math.floor(stat.total_seconds),
          })
          .onConflictDoUpdate({
            target: [UserSummaryLanguage.date, UserSummaryLanguage.userId, UserSummaryLanguage.programLanguageName],
            set: {
              totalSeconds: Math.floor(stat.total_seconds),
            },
          });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        wakaq.logger?.debug(`Failed to upsert UserSummaryLanguage for language ${stat.name}`);
      }
    }),
  );

  await Promise.all(
    summary.editors.map(async (stat) => {
      if (stat.name === 'Unknown Editor') {
        return;
      }
      try {
        await db
          .insert(UserSummaryEditor)
          .values({
            date: summary.range.date,
            userId: user.id,
            editorName: stat.name,
            totalSeconds: Math.floor(stat.total_seconds),
          })
          .onConflictDoUpdate({
            target: [UserSummaryEditor.date, UserSummaryEditor.userId, UserSummaryEditor.editorName],
            set: {
              totalSeconds: Math.floor(stat.total_seconds),
            },
          });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        wakaq.logger?.debug(`Failed to upsert UserSummaryEditor for editor ${stat.name}`);
      }
    }),
  );
}

export const syncUserSummaries = wakaq.task(
  async (userId: unknown) => {
    const result = z.string().nonempty().safeParse(userId);

    if (!result.success) {
      wakaq.logger?.error(result.error.message);
      return;
    }

    const user = await db.query.User.findFirst({
      where: eq(User.id, result.data),
      columns: { id: true, accessToken: true, lastSyncedStatsAt: true },
    });

    if (!user) {
      wakaq.logger?.error('No user found with id: ', result.data);
      return;
    }

    const minsSinceSync = user.lastSyncedStatsAt ? differenceInMinutes(new Date(), user.lastSyncedStatsAt) : Infinity;
    if (minsSinceSync < 30) {
      wakaq.logger?.debug(`Recently synced this user’s stats ${minsSinceSync} mins ago, skipping`);
      return;
    }

    wakaq.logger?.debug(`Fetching WakaTime summaries for user ${user.id}.`);

    await _syncUserSummary(user);
  },
  { name: 'getUserSummary' },
);
