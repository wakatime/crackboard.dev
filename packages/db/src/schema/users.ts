import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { citext } from './types';

export const User = pgTable(
  'User',
  {
    createdAt: timestamp()
      .notNull()
      .$default(() => new Date()),
    id: varchar().primaryKey(),
    sessionId: varchar()
      .notNull()
      .unique()
      .$defaultFn(() => `crackboardsession_${createId()}`),
    username: citext().unique(),
    fullName: varchar(),
    accessToken: varchar().notNull(),
    refreshToken: varchar().notNull(),
    avatarUrl: text(),
    bio: text(),
    wonderfulDevUsername: text(),
    twitterUsername: text(),
    githubUsername: text(),
    isOwner: boolean(),
    lastSyncedStatsAt: timestamp(),
  },
  (table) => [index().on(table.username), unique().on(table.isOwner)],
);

export const userRelations = relations(User, ({ many }) => ({
  auditLogs: many(AuditLog),
}));

export const AuditLog = pgTable(
  'AuditLog',
  {
    createdAt: timestamp()
      .notNull()
      .$default(() => new Date()),
    event: varchar().notNull(),
    id: varchar()
      .primaryKey()
      .$defaultFn(() => createId()),
    ip: varchar(),
    metadata: jsonb().notNull().default('{}'),
    userAgent: varchar(),
    userId: citext()
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
  },
  (table) => [index().on(table.userId, table.createdAt.desc().nullsLast()), index().on(table.userId)],
);

export const auditLogRelations = relations(AuditLog, ({ one }) => ({
  user: one(User, {
    fields: [AuditLog.userId],
    references: [User.id],
  }),
}));
