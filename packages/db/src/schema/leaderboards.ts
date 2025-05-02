import type { Leader } from '@workspace/core/types';
import { date, json, pgTable } from 'drizzle-orm/pg-core';

export const DailyLeaderboard = pgTable('DailyLeaderboard', {
  date: date().notNull(),
  leaders: json('details').$type<Leader[]>().notNull(),
});

export const WeeklyLeaderboard = pgTable('WeeklyLeaderboard', {
  weekEndDate: date().notNull(),
  leaders: json('details').$type<Leader[]>().notNull(),
});

export const MonthlyLeaderboard = pgTable('MonthlyLeaderboard', {
  monthEndDate: date().notNull(),
  leaders: json('details').$type<Leader[]>().notNull(),
});
