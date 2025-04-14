import { and, desc, eq, or } from '@acme/db';
import { db } from '@acme/db/drizzle';
import type { Company, User } from '@acme/db/schema';
import { ChatMessage, ChatThread, ChatThreadReadByCompanyUser, ChatThreadReadByUser } from '@acme/db/schema';

import type { PublicChatThread } from '../../types';
import { truncate } from '../../utils';
import { companyToPublicCompany } from './company';
import { userToPublicUser } from './user';

export const chatThreadToPublicThread = async (
  thread: typeof ChatThread.$inferSelect & {
    company?: typeof Company.$inferSelect | null;
    user?: typeof User.$inferSelect | null;
    otherUser?: typeof User.$inferSelect | null;
  },
  perspective: 'dev' | 'company',
  currentUserId?: string,
): Promise<PublicChatThread> => {
  let isUnread = true;
  if (currentUserId) {
    if (perspective === 'dev') {
      const lastRead = await db.query.ChatThreadReadByUser.findFirst({
        where: and(eq(ChatThreadReadByUser.threadId, thread.id), eq(ChatThreadReadByUser.userId, currentUserId)),
      });
      if (lastRead && lastRead.readAt >= thread.mostRecentMessageAt) {
        isUnread = false;
      }
    } else {
      const lastRead = await db.query.ChatThreadReadByCompanyUser.findFirst({
        where: and(eq(ChatThreadReadByCompanyUser.threadId, thread.id), eq(ChatThreadReadByCompanyUser.companyUserId, currentUserId)),
      });
      if (lastRead && lastRead.readAt >= thread.mostRecentMessageAt) {
        isUnread = false;
      }
    }
  }
  const ret: PublicChatThread = {
    id: thread.id,
    perspective,
    mostRecentMessageAt: thread.mostRecentMessageAt,
    companyId: thread.companyId,
    userId: currentUserId && currentUserId === thread.otherUserId ? thread.otherUserId : thread.userId,
    otherUserId: currentUserId && currentUserId === thread.otherUserId ? thread.userId : thread.otherUserId,
    createdAt: thread.createdAt,
    textPreview: truncate(
      (
        await db.query.ChatMessage.findFirst({
          where: eq(ChatMessage.threadId, thread.id),
          orderBy: [desc(ChatMessage.sentAt)],
        })
      )?.text ?? '',
    ),
    isUnread,
  };
  if (thread.company) {
    ret.company = await companyToPublicCompany(thread.company);
  } else if (thread.otherUser && thread.otherUser.id !== currentUserId) {
    ret.user = await userToPublicUser(thread.otherUser);
  } else if (thread.user) {
    ret.user = await userToPublicUser(thread.user);
  }
  return ret;
};

export const getOrCreateCompanyChatThread = async (userId: string, companyId: string) => {
  const existing = await db.query.ChatThread.findFirst({
    where: and(eq(ChatThread.userId, userId), eq(ChatThread.companyId, companyId)),
    columns: { id: true, createdAt: true },
  });
  if (existing) {
    return { created: false, thread: existing };
  }

  const now = new Date();

  const [thread] = await db
    .insert(ChatThread)
    .values({
      mostRecentMessageAt: now,
      createdAt: now,
      userId,
      companyId,
    })
    .onConflictDoNothing()
    .returning({ id: ChatThread.id, createdAt: ChatThread.createdAt });
  if (thread) {
    return { created: true, thread };
  }

  const secondTry = await db.query.ChatThread.findFirst({
    where: and(eq(ChatThread.userId, userId), eq(ChatThread.companyId, companyId)),
    columns: { id: true, createdAt: true },
  });
  if (secondTry) {
    return { created: false, thread: secondTry };
  }

  throw Error('Unable to create chat thread.');
};

export const getOrCreateUserChatThread = async (userId: string, otherUserId: string) => {
  const existing = await db.query.ChatThread.findFirst({
    where: or(
      and(eq(ChatThread.userId, userId), eq(ChatThread.otherUserId, otherUserId)),
      and(eq(ChatThread.userId, otherUserId), eq(ChatThread.otherUserId, userId)),
    ),
    columns: { id: true, createdAt: true },
  });
  if (existing) {
    return { created: false, thread: existing };
  }

  const now = new Date();

  const [thread] = await db
    .insert(ChatThread)
    .values({
      mostRecentMessageAt: now,
      createdAt: now,
      userId,
      otherUserId,
    })
    .onConflictDoNothing()
    .returning({ id: ChatThread.id, createdAt: ChatThread.createdAt });
  if (thread) {
    return { created: true, thread };
  }

  const secondTry = await db.query.ChatThread.findFirst({
    where: or(
      and(eq(ChatThread.userId, userId), eq(ChatThread.otherUserId, otherUserId)),
      and(eq(ChatThread.userId, otherUserId), eq(ChatThread.otherUserId, userId)),
    ),
    columns: { id: true, createdAt: true },
  });
  if (secondTry) {
    return { created: false, thread: secondTry };
  }

  throw Error('Unable to create chat thread.');
};
