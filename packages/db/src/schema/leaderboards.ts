import { boolean, date, index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import type { Leader } from '../types';
import { citext } from './types';

export const DailyLeaderboard = pgTable('DailyLeaderboard', {
  id: uuid().notNull().primaryKey().defaultRandom(),
  date: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});

export const WeeklyLeaderboard = pgTable('WeeklyLeaderboard', {
  id: uuid().notNull().primaryKey().defaultRandom(),
  weekEndDate: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});

export const MonthlyLeaderboard = pgTable('MonthlyLeaderboard', {
  id: uuid().notNull().primaryKey().defaultRandom(),
  monthEndDate: date().notNull(),
  leaders: jsonb('details').$type<Leader[]>().notNull(),
});

export const ProgramLanguage = pgTable('ProgramLanguage', {
  color: varchar(),
  name: citext().primaryKey(),
});

export const ProgramLanguageAlias = pgTable(
  'ProgramLanguageAlias',
  {
    id: citext().primaryKey(),
    programLanguageName: citext()
      .notNull()
      .references(() => ProgramLanguage.name, { onDelete: 'cascade' }),
  },
  (table) => [index().on(table.programLanguageName)],
);

export const Editor = pgTable('Editor', {
  color: varchar(),
  name: citext().primaryKey(),
});

export const LeaderboardConfig = pgTable('LeaderboardConfig', {
  id: varchar().notNull().primaryKey(),
  isPublic: boolean().notNull().default(true),
  isInviteOnly: boolean().notNull().default(false),
  inviteCode: varchar(),
  timezone: varchar().notNull().default('UTC'),
  createdAt: timestamp()
    .notNull()
    .$default(() => new Date()),
  lastSyncedStatsAt: timestamp(),
});
