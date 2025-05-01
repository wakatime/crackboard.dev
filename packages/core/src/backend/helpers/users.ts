import type { User } from '@workspace/db/schema';

import { BASE_URL } from '../../constants';
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
    url: `${BASE_URL}/${encodeURIComponent(user.username ?? user.id)}`,
    bio: user.bio,
  };
};
