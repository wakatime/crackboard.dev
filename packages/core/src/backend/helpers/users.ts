import { db, eq } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import type { PublicUser, WakaTimeUser } from '../../types';

export const userToPublicUser = async (
  user: typeof User.$inferSelect,
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<PublicUser> => {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl,
    name: user.fullName,
    url: `https://wakatime.com/@${encodeURIComponent(user.username ?? user.id)}`,
    wonderfulDevUrl: user.wonderfulDevUsername ? `https://wonderful.dev/${encodeURIComponent(user.wonderfulDevUsername)}` : null,
    wonderfulDevUsername: user.wonderfulDevUsername,
    twitterUrl: user.twitterUsername ? `https://x.com/${encodeURIComponent(user.twitterUsername)}` : null,
    twitterUsername: user.twitterUsername,
    bio: user.bio,
  };
};

export const createOrUpdateUser = async (
  wakaUser: WakaTimeUser,
  accessToken: string,
  refreshToken: string,
): Promise<[typeof User.$inferSelect | undefined, boolean]> => {
  const [user, isNewUser] = await db.transaction(async (tx) => {
    const user = await tx.query.User.findFirst({ where: eq(User.id, wakaUser.id) });
    if (user) {
      return [
        (
          await tx
            .update(User)
            .set({
              username: wakaUser.username,
              fullName: wakaUser.full_name,
              avatarUrl: wakaUser.photo,
              wonderfulDevUsername: wakaUser.wonderfuldev_username,
              twitterUsername: wakaUser.twitter_username,
              bio: wakaUser.bio,
              accessToken,
              refreshToken,
            })
            .where(eq(User.id, wakaUser.id))
            .returning()
        )[0],
        false,
      ];
    }
    const anyUser = await tx.query.User.findFirst({ columns: { id: true } });
    const [newUser] = await tx
      .insert(User)
      .values({
        id: wakaUser.id,
        username: wakaUser.username,
        wonderfulDevUsername: wakaUser.wonderfuldev_username,
        twitterUsername: wakaUser.twitter_username,
        bio: wakaUser.bio,
        fullName: wakaUser.full_name,
        avatarUrl: wakaUser.photo,
        isOwner: anyUser ? null : true, // first sign up is the owner
        accessToken,
        refreshToken,
      })
      .onConflictDoNothing()
      .returning();
    if (newUser) {
      return [newUser, true];
    }
    return [
      (
        await tx
          .update(User)
          .set({
            username: wakaUser.username,
            fullName: wakaUser.full_name,
            avatarUrl: wakaUser.photo,
            wonderfulDevUsername: wakaUser.wonderfuldev_username,
            twitterUsername: wakaUser.twitter_username,
            bio: wakaUser.bio,
            accessToken,
            refreshToken,
          })
          .where(eq(User.id, wakaUser.id))
          .returning()
      )[0],
      false,
    ];
  });
  return [user, isNewUser];
};

export const updateUser = async (wakaUser: WakaTimeUser) => {
  await db
    .update(User)
    .set({
      username: wakaUser.username,
      fullName: wakaUser.full_name,
      avatarUrl: wakaUser.photo,
      wonderfulDevUsername: wakaUser.wonderfuldev_username,
      twitterUsername: wakaUser.twitter_username,
      bio: wakaUser.bio,
    })
    .where(eq(User.id, wakaUser.id));
};
