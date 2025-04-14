import { and, count, eq } from '@acme/db';
import { db } from '@acme/db/drizzle';
import { List, ListFollower, ListMember, User } from '@acme/db/schema';
import type { NextRequest } from 'next/server';

import type { PublicList, PublicUser } from '../../types';
import { authenticatedUserFromRequest } from '../auth';
import { userToPublicUser } from './user';

export const getList = async (
  listId: string,
  req: NextRequest,
  sessionId?: string,
  followersCount?: number,
  membersCount?: number,
): Promise<PublicList | null> => {
  const list = await db.query.List.findFirst({
    where: eq(List.id, listId),
    with: { user: true },
  });
  if (!list) {
    return null;
  }

  if (list.isPrivate) {
    // check if user is a member of the list
    const currentUser = (await authenticatedUserFromRequest(req, sessionId)) as PublicUser | null;
    if (!currentUser) {
      return null;
    }

    if (list.userId !== currentUser.id) {
      const isMember = await db.query.ListMember.findFirst({
        where: and(eq(ListMember.listId, listId), eq(ListMember.userId, currentUser.id)),
      });

      if (!isMember) {
        return null;
      }
    }
  }

  return {
    ...list,
    followersCount: followersCount ?? (await getListFollowerCount(listId)),
    membersCount: membersCount ?? (await getListMemberCount(listId)),
    user: await userToPublicUser(list.user),
  };
};

export const listToPublicList = async (
  list: typeof List.$inferSelect,
  followersCount?: number,
  membersCount?: number,
): Promise<PublicList> => {
  const user = await db.query.User.findFirst({ where: eq(User.id, list.userId) });
  if (!user) {
    throw new Error('User not found!');
  }
  return {
    ...list,
    followersCount: followersCount ?? (await getListFollowerCount(list.id)),
    membersCount: membersCount ?? (await getListMemberCount(list.id)),
    user: await userToPublicUser(user),
  };
};

export const getListMemberCount = async (listId: string) => {
  const result = await db.select({ count: count() }).from(ListMember).where(eq(ListMember.listId, listId));
  return result[0]?.count ?? 0;
};

export const getListFollowerCount = async (listId: string) => {
  const result = await db.select({ count: count() }).from(ListFollower).where(eq(ListFollower.listId, listId));
  return result[0]?.count ?? 0;
};
