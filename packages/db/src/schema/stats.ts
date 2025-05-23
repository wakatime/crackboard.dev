import { date, integer, pgTable, unique } from 'drizzle-orm/pg-core';

import { Editor, ProgramLanguage } from './leaderboards';
import { citext } from './types';
import { User } from './users';

export const UserSummary = pgTable(
  'UserSummary',
  {
    date: date().notNull(),
    userId: citext()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    totalSeconds: integer().notNull(),
  },
  (table) => [unique().on(table.date, table.userId)],
);

export const UserSummaryLanguage = pgTable(
  'UserSummaryLanguage',
  {
    date: date().notNull(),
    userId: citext()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    programLanguageName: citext()
      .notNull()
      .references(() => ProgramLanguage.name, { onDelete: 'cascade' }),
    totalSeconds: integer().notNull(),
  },
  (table) => [unique().on(table.date, table.userId, table.programLanguageName)],
);

export const UserSummaryEditor = pgTable(
  'UserSummaryEditor',
  {
    date: date().notNull(),
    userId: citext()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    editorName: citext()
      .notNull()
      .references(() => Editor.name, { onDelete: 'cascade' }),
    totalSeconds: integer().notNull(),
  },
  (table) => [unique().on(table.date, table.userId, table.editorName)],
);
