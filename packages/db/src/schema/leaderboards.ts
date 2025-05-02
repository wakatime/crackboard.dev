import { date, jsonb, pgTable } from 'drizzle-orm/pg-core';

import type { Leader } from '../types';

export const DailyLeaderboard = pgTable('DailyLeaderboard', {
  date: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});

export const WeeklyLeaderboard = pgTable('WeeklyLeaderboard', {
  weekEndDate: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});

export const MonthlyLeaderboard = pgTable('MonthlyLeaderboard', {
  monthEndDate: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});
