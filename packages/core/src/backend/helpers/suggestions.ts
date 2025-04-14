import { alias, and, desc, eq, gt, isNull, not, notInArray, or, sql } from '@acme/db';
import { db } from '@acme/db/drizzle';
import { Integration, SuggestFollowUser, User, UserFollow } from '@acme/db/schema';

import type { PublicUser } from '../../types';
import { userToPublicUser } from './user';

export const getFriendsOfFriends = async (
  users: PublicUser[],
  user: typeof User.$inferSelect,
  limit: number,
  currentUser?: typeof User.$inferSelect | null,
) => {
  const Followings = db.$with('Followings').as(db.select().from(UserFollow).where(eq(UserFollow.followedById, user.id)));
  const uf1 = alias(UserFollow, 'uf1');
  const uf2 = alias(UserFollow, 'uf2');
  const FollowingsFollowings = db
    .$with('FollowingsFollowings')
    .as(
      db
        .select({ followingId: uf2.followingId })
        .from(uf1)
        .innerJoin(uf2, eq(uf1.followingId, uf2.followedById))
        .where(eq(uf1.followedById, user.id)),
    );

  const UserIntegrations = db.$with('UserIntegrations').as(
    db
      .select({
        totalScore: sql<number>`cast(sum(${Integration.providerAccountScore}) as int)`.as('totalScore'),
        userId: Integration.userId,
      })
      .from(Integration)
      .groupBy(Integration.userId),
  );

  let query = db
    .with(Followings, FollowingsFollowings, UserIntegrations)
    .select({ user: User })
    .from(User)
    .leftJoin(Followings, eq(User.id, Followings.followingId))
    .leftJoin(FollowingsFollowings, eq(User.id, FollowingsFollowings.followingId))
    .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId));

  if (currentUser) {
    query = query.leftJoin(UserFollow, and(eq(User.id, UserFollow.followingId), eq(UserFollow.followedById, currentUser.id)));
  }

  const suggestedUsers = await query
    .where(
      and(
        not(eq(User.id, user.id)),
        or(not(isNull(Followings.followingId)), not(isNull(FollowingsFollowings.followingId))),
        not(isNull(UserIntegrations.userId)),
        gt(UserIntegrations.totalScore, 0),
        ...(currentUser ? [not(eq(User.id, currentUser.id))] : []),
        ...(currentUser ? [or(not(eq(UserFollow.followedById, currentUser.id)), isNull(UserFollow.followedById))] : []),
        ...(users.length > 0
          ? [
              notInArray(
                User.id,
                users.map((user) => user.id),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
    .limit(limit)
    .then((results) => {
      const u = results.map((row) => row.user);
      return u.filter((user, i) => u.findIndex((item) => item.id === user.id) === i);
    });

  return Promise.all(
    suggestedUsers.map(async (user) => {
      const publicUser = await userToPublicUser(user);
      const doesFollowMe = currentUser
        ? (
            await db
              .select()
              .from(UserFollow)
              .where(and(eq(UserFollow.followedById, user.id), eq(UserFollow.followingId, currentUser.id)))
          ).length > 0
        : false;
      return { ...publicUser, doesFollowMe };
    }),
  );
};

export const getTopUserSuggestions = async (users: PublicUser[], limit: number, currentUser?: typeof User.$inferSelect | null) => {
  // TODO: if we have currentUser, filter by SuggestFollowUser.firstProgramLanguageName matching the current user's top languages

  let query = db.select({ user: User }).from(User).leftJoin(SuggestFollowUser, eq(User.id, SuggestFollowUser.userId));

  if (currentUser) {
    query = query.leftJoin(UserFollow, and(eq(User.id, UserFollow.followingId), eq(UserFollow.followedById, currentUser.id)));
  }

  const suggestedUsers = await query
    .where(
      and(
        gt(SuggestFollowUser.integrationMaxScore, 0),
        ...(currentUser ? [not(eq(User.id, currentUser.id))] : []),
        ...(currentUser ? [or(not(eq(UserFollow.followedById, currentUser.id)), isNull(UserFollow.followedById))] : []),
        ...(users.length > 0
          ? [
              notInArray(
                User.id,
                users.map((user) => user.id),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(SuggestFollowUser.integrationMaxScore), SuggestFollowUser.userId)
    .limit(limit);

  return await Promise.all(
    suggestedUsers.map(async (row) => {
      const publicUser = await userToPublicUser(row.user);
      const doesFollowMe = currentUser
        ? (
            await db
              .select()
              .from(UserFollow)
              .where(and(eq(UserFollow.followedById, row.user.id), eq(UserFollow.followingId, currentUser.id)))
          ).length > 0
        : false;
      return { ...publicUser, doesFollowMe };
    }),
  );
};
