import { and, count, desc, eq, isNotNull, isNull, sql, sum } from '@acme/db';
import { db } from '@acme/db/drizzle';
import { redis } from '@acme/db/redis';
import type { GitHubUser } from '@acme/db/schema';
import {
  CompanyStarredDev,
  DevStarredCompany,
  Integration,
  Post,
  PostAnonymousInfo,
  ProfileDefault,
  ProgramLanguageBadge,
  TimelineTab,
  User,
  UserBlockedUser,
  UserFollow,
  UserInfo,
} from '@acme/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { Duration } from 'ts-duration';

import { BASE_URL } from '../../constants';
import { avatarForConnection, nameForConnection, websiteUrlForConnection } from '../../integrations/extensions/getters';
import type { AnonymousPublicUser, IntegrationConnection, PublicProgramLanguageBadge, PublicUser } from '../../types';
import { makeExternalUrl } from '../../utils';

export const userToPublicUser = async (
  user: typeof User.$inferSelect & {
    programLanguageBadges?: (typeof ProgramLanguageBadge.$inferSelect)[];
    info?: { githubUser: GitHubUser };
  },
  viewerId?: string,
  excludeExtras?: boolean,
): Promise<PublicUser> => {
  if (!user.info) {
    user.info = await db.query.UserInfo.findFirst({ columns: { githubUser: true }, where: eq(UserInfo.userId, user.id) });
    if (!user.info) {
      throw Error('Missing user info.');
    }
  }
  const gh = user.info.githubUser;

  const getIsBlocked = async (): Promise<boolean> => {
    if (!viewerId) {
      return false;
    }
    const [row] = await db
      .select()
      .from(UserBlockedUser)
      .where(and(eq(UserBlockedUser.userId, viewerId), eq(UserBlockedUser.blockedUserId, user.id)));
    return !!row;
  };

  const isBlocked = await getIsBlocked();

  const totalPostsPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(Post)
          .where(and(eq(Post.postedById, user.id), eq(Post.postType, 'thread'), isNull(Post.rootParentId)))
          .then((results) => results.at(0)?.count ?? 0);
  const totalRepliesPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(Post)
          .where(and(eq(Post.postedById, user.id), eq(Post.postType, 'thread'), isNotNull(Post.rootParentId)))
          .then((results) => results.at(0)?.count ?? 0);
  const totalPollsPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(Post)
          .where(and(eq(Post.postedById, user.id), eq(Post.postType, 'poll')))
          .then((results) => results.at(0)?.count ?? 0);
  const followersCountPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(UserFollow)
          .where(eq(UserFollow.followingId, user.id))
          .then((results) => results.at(0)?.count ?? 0);
  const followingCountPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(UserFollow)
          .where(eq(UserFollow.followedById, user.id))
          .then((results) => results.at(0)?.count ?? 0);
  const starsCountPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(CompanyStarredDev)
          .where(eq(CompanyStarredDev.userId, user.id))
          .then((results) => results.at(0)?.count ?? 0);
  const starredCountPromise =
    isBlocked || excludeExtras
      ? 0
      : db
          .select({ count: count() })
          .from(DevStarredCompany)
          .where(eq(DevStarredCompany.userId, user.id))
          .then((results) => results.at(0)?.count ?? 0);

  const getUserFollowViewer = async (): Promise<boolean> => {
    if (!viewerId || isBlocked || viewerId === user.id) {
      return false;
    }
    return doesUserFollowUser(viewerId, user.id);
  };

  const getViewerFollowUser = async (): Promise<boolean> => {
    if (!viewerId || isBlocked || viewerId === user.id) {
      return false;
    }
    return doesUserFollowUser(user.id, viewerId);
  };

  const getProgramLanguageBadges = async (): Promise<PublicProgramLanguageBadge[]> => {
    if (isBlocked || excludeExtras) {
      return [];
    }
    if (user.programLanguageBadges == undefined) {
      const programLanguageBadges = await db.query.ProgramLanguageBadge.findMany({
        columns: { programLanguageName: true, provider: true, score: true, metadata: true },
        where: eq(ProgramLanguageBadge.userId, user.id),
      });
      return Promise.all(programLanguageBadges.map(badgeToPublicBadge));
    } else {
      return Promise.all(user.programLanguageBadges.map(badgeToPublicBadge));
    }
  };

  const [
    starsCount,
    starredCount,
    followersCount,
    followingCount,
    totalPosts,
    totalReplies,
    totalPolls,
    programLanguageBadges,
    name,
    avatarUrl,
    websiteUrl,
    isFollowing,
    doesFollowMe,
  ] = await Promise.all([
    starsCountPromise,
    starredCountPromise,
    followersCountPromise,
    followingCountPromise,
    totalPostsPromise,
    totalRepliesPromise,
    totalPollsPromise,
    getProgramLanguageBadges(),
    getNameForUser(user),
    getAvatarForUser(user),
    getWebsiteUrl(user),
    getUserFollowViewer(),
    getViewerFollowUser(),
  ]);

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    starsCount,
    starredCount,
    followersCount,
    followingCount,
    totalPosts,
    totalReplies,
    totalPolls,
    githubId: user.githubId,
    githubProfileUrl: `https://github.com/${gh.login}`,
    githubUsername: gh.login,
    url: `${BASE_URL}/${encodeURIComponent(user.username ?? user.id)}`,
    avatarUrl,
    name,
    websiteUrl,
    programLanguageBadges,
    isFollowing,
    doesFollowMe,
    isBlocked,
  };
};

export const userToAnonymousUser = async (
  user: typeof User.$inferSelect & { programLanguageBadges?: (typeof ProgramLanguageBadge.$inferSelect)[] },
  post?: { id: string; rootParentId?: string | null } | null,
): Promise<AnonymousPublicUser> => {
  if (post) {
    const info = await db.query.PostAnonymousInfo.findFirst({
      where: and(
        isNull(PostAnonymousInfo.revealedAt),
        eq(PostAnonymousInfo.userId, user.id),
        eq(PostAnonymousInfo.rootPostId, post.rootParentId ?? post.id),
      ),
    });
    if (info) {
      return {
        avatarUrl: '',
        followersCount: 0,
        followingCount: 0,
        id: info.username,
        isAnonymous: true,
        name: null,
        url: '',
        username: info.username,
        websiteUrl: null,
      };
    }
  }
  return {
    avatarUrl: '',
    followersCount: 0,
    followingCount: 0,
    id: '',
    isAnonymous: true,
    name: null,
    url: '',
    username: '',
    websiteUrl: null,
  };
};

export const getAvatarForUserId = async (
  userId: string,
  profileDefaults?: (typeof ProfileDefault.$inferSelect)[],
  githubUser?: GitHubUser,
): Promise<string> => {
  if (profileDefaults === undefined) {
    profileDefaults = await db.query.ProfileDefault.findMany({
      limit: 1,
      where: and(eq(ProfileDefault.userId, userId), eq(ProfileDefault.defaultType, 'avatar')),
    });
  }
  const avatar = profileDefaults.find((d) => d.defaultType == 'avatar') as
    | { integration?: typeof Integration.$inferSelect; integrationId: string }
    | undefined;
  if (avatar && !avatar.integration) {
    avatar.integration = await db.query.Integration.findFirst({ where: eq(Integration.id, avatar.integrationId) });
  }
  const url = avatarForConnection(avatar?.integration as unknown as IntegrationConnection | undefined);
  if (url) {
    return url;
  }
  if (!githubUser) {
    const info = await db.query.UserInfo.findFirst({ columns: { githubUser: true }, where: eq(UserInfo.userId, userId) });
    if (!info) {
      return '';
    }
    githubUser = info.githubUser;
  }
  return githubUser.avatar_url;
};

export const getNameForUser = async (
  user: typeof User.$inferSelect & { info?: { githubUser: GitHubUser }; profileDefaults?: (typeof ProfileDefault.$inferSelect)[] },
): Promise<string | null> => {
  if (!user.info) {
    user.info = await db.query.UserInfo.findFirst({ columns: { githubUser: true }, where: eq(UserInfo.userId, user.id) });
    if (!user.info) {
      throw Error('Missing user info.');
    }
  }
  const gh = user.info.githubUser;
  let defaults = user.profileDefaults;

  if (defaults === undefined) {
    defaults = await db.query.ProfileDefault.findMany({
      where: and(eq(ProfileDefault.userId, user.id), eq(ProfileDefault.defaultType, 'name')),
    });
  }
  const name = defaults.find((d) => d.defaultType == 'name') as
    | { integration?: typeof Integration.$inferSelect; integrationId: string }
    | undefined;

  if (name && !name.integration) {
    name.integration = await db.query.Integration.findFirst({ where: eq(Integration.id, name.integrationId) });
  }

  return nameForConnection(name?.integration as unknown as IntegrationConnection) ?? gh.name ?? null;
};

export const getWebsiteUrl = async (user: typeof User.$inferSelect & { info?: { githubUser: GitHubUser } }): Promise<string | null> => {
  if (!user.info) {
    user.info = await db.query.UserInfo.findFirst({ columns: { githubUser: true }, where: eq(UserInfo.userId, user.id) });
    if (!user.info) {
      throw Error('Missing user info.');
    }
  }
  const gh = user.info.githubUser;
  let defaults = (user as unknown as { profileDefaults?: (typeof ProfileDefault.$inferSelect)[] }).profileDefaults;
  if (defaults === undefined) {
    defaults = await db.query.ProfileDefault.findMany({
      where: and(eq(ProfileDefault.userId, user.id), eq(ProfileDefault.defaultType, 'websiteUrl')),
    });
  }
  const websiteUrl = defaults.find((d) => d.defaultType == 'websiteUrl') as
    | { integration?: typeof Integration.$inferSelect; integrationId: string }
    | undefined;
  if (websiteUrl && !websiteUrl.integration) {
    websiteUrl.integration = await db.query.Integration.findFirst({ where: eq(Integration.id, websiteUrl.integrationId) });
  }

  const url = websiteUrlForConnection(websiteUrl?.integration as unknown as IntegrationConnection) ?? gh.blog;

  if (!url) {
    return null;
  }

  return makeExternalUrl(url);
};

export const getAvatarForUser = async (user: typeof User.$inferSelect & { info?: { githubUser: GitHubUser } }): Promise<string> => {
  if (!user.info) {
    user.info = await db.query.UserInfo.findFirst({ columns: { githubUser: true }, where: eq(UserInfo.userId, user.id) });
    if (!user.info) {
      throw Error('Missing user info.');
    }
  }
  const defaults = (user as unknown as { profileDefaults?: (typeof ProfileDefault.$inferSelect)[] }).profileDefaults;
  return await getAvatarForUserId(user.id, defaults, user.info.githubUser);
};

export const doesUserFollowUser = async (followedById: string, followingId: string) => {
  if (followingId === followedById) {
    return false;
  }

  return (
    (
      await db
        .select()
        .from(UserFollow)
        .where(and(eq(UserFollow.followedById, followedById), eq(UserFollow.followingId, followingId)))
    ).length > 0
  );
};

export const badgeToPublicBadge = async (
  badge: Omit<typeof ProgramLanguageBadge.$inferSelect, 'userId'>,
): Promise<PublicProgramLanguageBadge> => {
  return {
    maxScore: await getCachedBadgeMaxScore(badge.programLanguageName),
    programLanguageName: badge.programLanguageName,
    metadata: badge.metadata,
    provider: badge.provider,
    score: badge.score,
  };
};

export const getCachedBadgeMaxScore = async (language: string) => {
  const key = `badge-max-score-${language}`;
  if (await redis.exists(key)) {
    const cache = await redis.get(key);
    if (cache !== null) {
      return parseInt(cache);
    }
  }

  const [row] = await db
    .select({ sumScore: sum(ProgramLanguageBadge.score).as('sumScore') })
    .from(ProgramLanguageBadge)
    .where(eq(ProgramLanguageBadge.programLanguageName, language))
    .groupBy(ProgramLanguageBadge.userId)
    .orderBy(desc(sum(ProgramLanguageBadge.score).as('sumScore')))
    .limit(1);
  const maxScore = parseInt(row?.sumScore ?? '0');

  await redis.setex(key, Duration.hour(24).seconds, maxScore);
  return maxScore;
};

export const getIsUserBlockedBy = async (currentUserId: string, blockedByUserId: string) => {
  return (
    (
      await db.execute<{ exists: boolean }>(
        sql`select exists(${db
          .select({ n: sql`1` })
          .from(UserBlockedUser)
          .where(and(eq(UserBlockedUser.userId, blockedByUserId), eq(UserBlockedUser.blockedUserId, currentUserId)))}) as exists`,
      )
    )[0]?.exists ?? false
  );
};

export const createTestDevUser = async (): Promise<typeof User.$inferSelect | undefined> => {
  const githubId = Math.floor(Math.random() * 9999999);
  const githubUser = {
    avatar_url: '',
    created_at: new Date().toISOString(),
    events_url: '',
    followers: 0,
    followers_url: '',
    following: 0,
    following_url: '',
    gists_url: '',
    html_url: '',
    id: githubId,
    login: createId(),
    node_id: '',
    organizations_url: '',
    received_events_url: '',
    repos_url: '',
    site_admin: false,
    starred_url: '',
    subscriptions_url: '',
    url: '',
  };

  const user = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(User)
      .values({
        githubId: githubId,
        username: githubUser.login,
      })
      .onConflictDoNothing()
      .returning();
    if (!newUser) {
      return;
    }
    await tx.insert(UserInfo).values({
      githubUser: githubUser,
      userId: newUser.id,
    });

    await tx.insert(TimelineTab).values({ filter: {} as const, name: 'Everything', userId: newUser.id });
    await tx
      .insert(TimelineTab)
      .values({ filter: { programLanguages: ['Python', 'TypeScript', 'JavaScript', 'Go'] } as const, name: 'Trends', userId: newUser.id });
    await tx.insert(TimelineTab).values({ filter: { excludingReplies: true } as const, name: 'Following', userId: newUser.id });

    return newUser;
  });

  return user;
};
