import { bigint, date, index, integer, pgTable, unique } from 'drizzle-orm/pg-core';

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
    aiInputTokens: bigint({ mode: 'number' }).notNull().default(0),
    aiOutputTokens: bigint({ mode: 'number' }).notNull().default(0),
    aiTotalTokens: bigint({ mode: 'number' }).notNull().default(0),
  },
  (table) => [
    unique().on(table.date, table.userId),
    index().on(table.date.desc(), table.totalSeconds.desc()),
    index().on(table.date.desc(), table.aiTotalTokens.desc()),
  ],
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
  (table) => [unique().on(table.date, table.userId, table.programLanguageName), index().on(table.date.desc(), table.totalSeconds.desc())],
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
  (table) => [unique().on(table.date, table.userId, table.editorName), index().on(table.date.desc(), table.totalSeconds.desc())],
);
