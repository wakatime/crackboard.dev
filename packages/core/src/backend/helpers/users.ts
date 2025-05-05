import type { User } from '@workspace/db/schema';

import type { PublicUser } from '../../types';

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
    bio: user.bio,
  };
};
