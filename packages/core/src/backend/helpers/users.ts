import { db, eq } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';

import { WAKATIME_INVALID_KEYWORD, WAKATIME_REDIRECT_URI, WAKATIME_TOKEN_URL } from '../../constants';
import { env } from '../../env';
import type { PublicUser, WakaTimeUser } from '../../types';
import { betterFetch } from '../../utils';

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

export const refreshTokenIfExpired = async (
  originalRespStatusCode: number,
  user: { id: string; accessToken: string; refreshToken: string },
) => {
  if (originalRespStatusCode !== 401 || user.refreshToken === WAKATIME_INVALID_KEYWORD) {
    return;
  }
  const resp = await betterFetch(WAKATIME_TOKEN_URL, {
    method: 'POST',
    body: JSON.stringify({
      client_id: env.WAKATIME_APP_ID,
      client_secret: env.WAKATIME_APP_SECRET,
      redirect_uri: WAKATIME_REDIRECT_URI,
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    }),
  });
  if (resp.status !== 200) {
    if (resp.status === 400) {
      const data = (await resp.json()) as { error?: string; error_description?: string } | undefined;
      if (data?.error === 'invalid_request') {
        if (data.error_description === 'User is no longer valid.') {
          await db.delete(User).where(eq(User.id, user.id));
          return;
        }
        if (data.error_description === 'refresh_token is invalid.') {
          await db
            .update(User)
            .set({ accessToken: WAKATIME_INVALID_KEYWORD, refreshToken: WAKATIME_INVALID_KEYWORD })
            .where(eq(User.id, user.id));
          return;
        }
      }
    }
    return;
  }
  const tokenData = (await resp.json()) as { access_token: string; refresh_token: string };
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  await db.update(User).set({ accessToken, refreshToken }).where(eq(User.id, user.id));
  return accessToken;
};
