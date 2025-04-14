import { and, asc, count, desc, eq, inArray, isNotNull, ne, sql } from '@acme/db';
import { s3 } from '@acme/db/aws';
import { db } from '@acme/db/drizzle';
import type { GitHubUser, PostMetadataInteraction, PostMetadataMilestone, PostMetadataPoll } from '@acme/db/schema';
import {
  HackerNewsDiscussion,
  Integration,
  IntegrationRepo,
  PollAnswer,
  PollVote,
  Post,
  PostReaction,
  SocialPreviewImage,
  User,
  UserImageUpload,
  UserInfo,
  UserWatchPost,
} from '@acme/db/schema';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { differenceInDays, differenceInHours, formatISO, isAfter, parseISO } from 'date-fns';
import sharp from 'sharp';

import { BASE_URL, SPACES_BUCKET_IMG } from '../../constants';
import { env } from '../../env';
import type { PostEmbed, PublicPoll, PublicPost, TimelineFeedItemType } from '../../types';
import { getFirstLinkFromPostContent, getRepoIssuesFromPostContent, getReposFromPostContent, makeExternalUrl } from '../../utils';
import { getCachedLanguageColor } from './language';
import { getIsUserBlockedBy, userToAnonymousUser, userToPublicUser } from './user';

export const canUserCreateOrVoteOnPosts = async (
  user: (typeof User.$inferSelect & { info?: { githubUser: GitHubUser; isBannedFromCreatingPosts: boolean | null } }) | string | undefined,
) => {
  if (!user) {
    return false;
  }
  if (typeof user === 'string') {
    const u = await db.transaction(async (tx) => {
      return await tx.query.User.findFirst({
        where: eq(User.id, user as string),
        with: {
          info: { columns: { githubUser: true, isBannedFromCreatingPosts: true } },
        },
      });
    });
    if (!u?.info) {
      return false;
    }
    user = u as typeof User.$inferSelect & { info: { githubUser: GitHubUser; isBannedFromCreatingPosts: boolean | null } };
  }
  if (!user.info) {
    user.info = await db.query.UserInfo.findFirst({
      columns: { githubUser: true, isBannedFromCreatingPosts: true },
      where: eq(UserInfo.userId, user.id),
    });
    if (!user.info) {
      throw Error('Missing user info.');
    }
  }
  if (user.info.isBannedFromCreatingPosts) {
    return false;
  }
  // TODO: Uncomment this once apple approves the app submission
  // if (env.NODE_ENV === 'production' && Math.abs(differenceInDays(new Date(), parseISO(user.info.githubUser.created_at))) < 7) {
  //   return false;
  // }
  const numIntegrations = (await db.select({ value: count() }).from(Integration).where(eq(Integration.userId, user.id)))[0]?.value ?? 0;
  if (env.NODE_ENV == 'development' && numIntegrations >= 1) {
    return true;
  }
  if (numIntegrations < 3) {
    return false;
  }
  return true;
};

export const getPollAnimationInfo = async (post: typeof Post.$inferSelect) => {
  const firstVote = await db.query.PollVote.findFirst({ orderBy: [asc(PollVote.createdAt)], where: eq(PollVote.postId, post.id) });
  const lastVote = await db.query.PollVote.findFirst({ orderBy: [desc(PollVote.createdAt)], where: eq(PollVote.postId, post.id) });
  const now = new Date();
  if (Math.abs(differenceInDays(now, post.postedAt)) > 2) {
    return {
      formatter: 'MMM Mo, yyyy',
      start: firstVote?.createdAt ?? post.postedAt,
      step: 'days',
      stop: lastVote?.createdAt ?? now, // TODO: format the time when animating using this formatter
    };
  }
  if (Math.abs(differenceInHours(now, post.createdAt)) > 2) {
    return {
      formatter: 'h aa MMM Mo',
      start: firstVote?.createdAt ?? post.postedAt,
      step: 'hours',
      stop: lastVote?.createdAt ?? now,
    };
  }
  return {
    formatter: 'HH:mm MMM Mo',
    start: firstVote?.createdAt ?? post.postedAt,
    step: 'minutes',
    stop: lastVote?.createdAt ?? now,
  };
};

export const getPublicPostMetadata = (post: typeof Post.$inferSelect) => {
  switch (post.postType) {
    case 'thread':
      return post.metadata as Record<string, never>;
    case 'poll': {
      const metadata = post.metadata as PostMetadataPoll & { endsAt: string };
      return {
        allowMultipleVotes: metadata.allowMultipleVotes,
        endsAt: parseISO(metadata.endsAt),
      } as PostMetadataPoll;
    }
    case 'milestone':
      return post.metadata as PostMetadataMilestone;
    case 'interaction':
      return post.metadata as PostMetadataInteraction;
  }
};

export const getPublicPostUrl = (post: { id: string }) => {
  return `${BASE_URL}/post/${encodeURIComponent(post.id)}`;
};

export const getPublicPoll = async (
  post: typeof Post.$inferSelect & { answers?: (typeof PollAnswer.$inferSelect)[] },
  currentUserId?: string,
): Promise<PublicPoll> => {
  const metadata = getPublicPostMetadata(post) as PostMetadataPoll;
  if (post.answers === undefined) {
    post.answers = await db.query.PollAnswer.findMany({ where: eq(PollAnswer.postId, post.id) });
  }
  return {
    allowMultipleVotes: metadata.allowMultipleVotes,
    answers: await Promise.all(
      post.answers.map(async (answer) => {
        const votes =
          (
            await db
              .select({ value: count() })
              .from(PollVote)
              .where(and(eq(PollVote.postId, post.id), eq(PollVote.answerId, answer.id)))
          )[0]?.value ?? 0;
        return { createdAt: answer.createdAt, id: answer.id, text: answer.text, votes };
      }),
    ),
    canCurrentUserVote: await getCanCurrentUserVote(post, currentUserId),
    endsAt: metadata.endsAt,
    totalVotes: (await db.select({ value: count() }).from(PollVote).where(eq(PollVote.postId, post.id)))[0]?.value ?? 0,
  };
};

export const getCanCurrentUserVote = async (post?: typeof Post.$inferSelect, currentUserId?: string) => {
  if (!post) {
    return false;
  }
  if (!currentUserId) {
    return true;
  }
  if (post.postedById === currentUserId) {
    return false;
  }
  if (await getIsUserBlockedBy(currentUserId, post.postedById)) {
    return false;
  }

  const poll = getPublicPostMetadata(post) as PostMetadataPoll;
  if (isAfter(new Date(), poll.endsAt)) {
    return false;
  }
  const alreadyVoted = await db.query.PollVote.findFirst({
    where: and(eq(PollVote.postId, post.id), eq(PollVote.userId, currentUserId)),
  });
  return !alreadyVoted;
};

export const getPublicPostById = async (postId: string, currentUserId?: string): Promise<PublicPost | null> => {
  const post = await db.query.Post.findFirst({
    where: eq(Post.id, postId),
    with: {
      answers: true,
      postedBy: true,
      rootParent: {
        with: {
          postedBy: true,
        },
      },
    },
  });

  if (!post) {
    return null;
  }

  return postToPublicPost(post, currentUserId);
};

export const postToPublicPost = async (
  post: typeof Post.$inferSelect & { answers?: (typeof PollAnswer.$inferSelect)[]; postedBy?: typeof User.$inferSelect },
  currentUserId?: string,
): Promise<PublicPost> => {
  if (!post.postedBy) {
    post.postedBy = await db.query.User.findFirst({ where: eq(User.id, post.postedById) });
  }

  if (!post.postedBy) {
    throw new Error('Post author not found!');
  }

  const getCurrentUserReactions = async (post: typeof Post.$inferSelect, currentUserId?: string): Promise<string[]> => {
    if (!currentUserId) {
      return [];
    }
    return db
      .select()
      .from(PostReaction)
      .where(and(eq(PostReaction.postId, post.id), eq(PostReaction.userId, currentUserId)))
      .then((reactions) => reactions.map((react) => react.reactionId));
  };

  const getReactions = async (post: typeof Post.$inferSelect, currentUserId?: string): Promise<PublicPost['reactions']> => {
    return Promise.all(
      (
        await db
          .select({ count: count(), id: PostReaction.reactionId })
          .from(PostReaction)
          .groupBy(PostReaction.reactionId)
          .where(eq(PostReaction.postId, post.id))
      ).map(async (reaction) => {
        const hasCurrentUserReacted = await getCurrentUserHasReacted(post.id, reaction.id, currentUserId);
        const usernames = await getUsernamesForReaction(post.id, reaction.id, currentUserId);
        return {
          count: reaction.count,
          hasCurrentUserReacted,
          id: reaction.id,
          usernames: hasCurrentUserReacted ? ['You', ...usernames] : usernames,
        };
      }),
    );
  };

  const getNumberOfReplies = async (): Promise<number> => {
    // Let's get only relatie reply count instead of all of them.
    const [row] = await db.select({ c: count() }).from(Post).where(eq(Post.parentId, post.id));
    return row?.c ?? 0;
  };

  const getEmbed = async (): Promise<PostEmbed | null> => {
    const image = await getPostImage(post);
    let embed: PostEmbed | null = null;

    if (image) {
      if (image.imageLink) {
        embed = {
          type: 'external',
          external: {
            url: image.imageLink,
            thumbnailUrl: image.imageUrl,
          },
        };
      } else {
        embed = {
          type: 'images',
          images: [
            {
              imageUrl: image.imageUrl,
              aspectRatio: {
                width: image.width,
                height: image.height,
              },
              alt: '',
            },
          ],
        };
      }
    }
    return embed;
  };

  const getWatchLevel = async () => {
    return currentUserId && (!post.rootParentId || post.postedById === currentUserId)
      ? ((
          await db.query.UserWatchPost.findFirst({
            columns: { level: true },
            where: and(eq(UserWatchPost.userId, currentUserId), eq(UserWatchPost.postId, post.id)),
          })
        )?.level ?? null)
      : null;
  };

  const getPostedBy = async (postedBy: typeof User.$inferSelect) => {
    if (post.isAnonymous) {
      return userToAnonymousUser(postedBy, post);
    }

    return userToPublicUser(postedBy);
  };

  const getProgramLanguageColor = async () => {
    return post.programLanguageName ? await getCachedLanguageColor(post.programLanguageName) : null;
  };

  const getHackerNewsStory = async () => {
    if (!post.hackerNewsStoryId) {
      return null;
    }

    const story = await db.query.HackerNewsDiscussion.findFirst({
      columns: { comments: true, points: true, postedAt: true, title: true, url: true },
      where: eq(HackerNewsDiscussion.storyId, post.hackerNewsStoryId),
    });
    if (!story) {
      return null;
    }

    return {
      comments: story.comments ?? 0,
      points: story.points ?? 0,
      postedAt: formatISO(story.postedAt),
      storyId: post.hackerNewsStoryId,
      storyUrl: `https://news.ycombinator.com/item?id=${post.hackerNewsStoryId}`,
      url: story.url,
    };
  };

  const getPoll = async () => {
    if (post.postType != 'poll') {
      return null;
    }

    const poll = await getPublicPoll(post, currentUserId);
    const canCurrentUserEditPoll = getCanCurrentUserEditPoll(post, poll, currentUserId);
    return { poll, canCurrentUserEditPoll };
  };

  const [
    reactions,
    currentUserReactions,
    numReplies,
    embed,
    watchLevel,
    postedBy,
    isMyPost,
    canCurrentUserReply,
    canHideReply,
    issues,
    repos,
    programLanguageColor,
    hackerNewsStory,
    poll,
  ] = await Promise.all([
    getReactions(post, currentUserId),
    getCurrentUserReactions(post, currentUserId),
    getNumberOfReplies(),
    getEmbed(),
    getWatchLevel(),
    getPostedBy(post.postedBy),
    getIsMyPost(post, currentUserId),
    canUserCreateOrVoteOnPosts(currentUserId),
    getCanHideReply(post, currentUserId),
    getVerifiedRepoIssuesFromPostContent(post.content ?? ''),
    getVerifiedReposFromPostContent(post.content ?? ''),
    getProgramLanguageColor(),
    getHackerNewsStory(),
    getPoll(),
  ]);

  return {
    canCurrentUserReply,
    canHideReply,
    codeBlockLanguages: post.codeBlockLanguages,
    content: post.content,
    createdAt: post.createdAt,
    currentUserReactions,
    id: post.id,
    embed,
    isAnonymous: post.isAnonymous,
    isHidden: !!post.isHidden,
    isMyPost,
    issues,
    mentions: post.mentions?.trim().split(' ') ?? [],
    companyMentions: post.companyMentions?.trim().split(' ') ?? [],
    metadata: getPublicPostMetadata(post),
    numReplies,
    parentId: post.parentId,
    postType: post.postType,
    postedAt: post.postedAt,
    postedBy,
    programLanguageColor,
    programLanguageName: post.programLanguageName,
    provider: post.provider,
    reactions,
    repos,
    rootParentId: post.rootParentId,
    url: getPublicPostUrl(post),
    viewedAt: null,
    watchLevel,
    hackerNewsStory,
    poll: poll?.poll,
    canCurrentUserEditPoll: poll?.canCurrentUserEditPoll ?? false,
  } satisfies PublicPost;
};

export const getCurrentUserHasReacted = async (postId: string, reactionId: string, currentUserId?: string) => {
  if (!currentUserId) {
    return false;
  }
  const exists = await db.execute<{ exists: boolean }>(
    sql`select exists(${db
      .select({ n: sql`1` })
      .from(PostReaction)
      .innerJoin(User, eq(User.id, PostReaction.userId))
      .where(and(eq(PostReaction.postId, postId), eq(PostReaction.reactionId, reactionId), eq(User.id, currentUserId)))}) as exists`,
  );
  return exists[0]?.exists ?? false;
};

export const getUsernamesForReaction = async (postId: string, reactionId: string, currentUserId?: string): Promise<string[]> => {
  if (currentUserId) {
    return (
      await db
        .select({ username: User.username })
        .from(PostReaction)
        .innerJoin(User, eq(User.id, PostReaction.userId))
        .where(
          and(
            eq(PostReaction.postId, postId),
            eq(PostReaction.reactionId, reactionId),
            isNotNull(User.username),
            ne(User.id, currentUserId),
          ),
        )
        .limit(10)
        .orderBy(desc(PostReaction.createdAt))
    )
      .map((u) => u.username)
      .filter((u) => u !== null);
  }
  return (
    await db
      .select({ username: User.username })
      .from(PostReaction)
      .innerJoin(User, eq(User.id, PostReaction.userId))
      .where(and(eq(PostReaction.postId, postId), eq(PostReaction.reactionId, reactionId), isNotNull(User.username)))
      .limit(10)
      .orderBy(desc(PostReaction.createdAt))
  )
    .map((u) => u.username)
    .filter((u) => u !== null);
};

export const getIsMyPost = (post?: { postedById: string }, currentUserId?: string) => {
  if (!post) {
    return false;
  }
  if (post.postedById !== currentUserId) {
    return false;
  }
  return true;
};

export const getCanHideReply = async (post?: typeof Post.$inferSelect, currentUserId?: string) => {
  if (!post?.rootParentId) {
    return false;
  }
  if (post.isHidden) {
    return false;
  }
  if (post.postedById === currentUserId) {
    return false;
  }
  const rootPost = await db.query.Post.findFirst({
    columns: { postedById: true },
    where: eq(Post.id, post.rootParentId),
  });
  if (!rootPost || rootPost.postedById !== currentUserId) {
    return false;
  }
  return true;
};

export const getCanCurrentUserEditPoll = (post: typeof Post.$inferSelect, poll: PublicPoll, currentUserId?: string) => {
  if (post.postedById !== currentUserId) {
    return false;
  }
  if (poll.totalVotes > 0) {
    return false;
  }
  if (isAfter(new Date(), poll.endsAt)) {
    return false;
  }
  return true;
};

const getImageAspectRatio = async (imageKey: string) => {
  const img = await s3.send(new GetObjectCommand({ Bucket: SPACES_BUCKET_IMG, Key: imageKey }));
  if (!img.Body) {
    return null;
  }

  const metadata = await sharp(await img.Body.transformToByteArray()).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
  };
};

export const getPostImage = async (
  post: typeof Post.$inferSelect,
): Promise<{ id: string; imageUrl: string; width: number; height: number; imageLink: string | null } | null> => {
  if (!post.imageId) {
    return null;
  }

  if (post.imageId.startsWith('image_')) {
    const image = await db.query.UserImageUpload.findFirst({
      columns: { id: true, width: true, height: true },
      where: eq(UserImageUpload.id, post.imageId),
    });
    if (!image) {
      return null;
    }

    if (image.width === null || image.height === null) {
      const aspectRatio = await getImageAspectRatio(`img/${post.imageId}`);
      if (aspectRatio?.width === undefined || aspectRatio.height === undefined) {
        return null;
      }

      await db
        .update(UserImageUpload)
        .set({
          width: aspectRatio.width,
          height: aspectRatio.height,
        })
        .where(eq(UserImageUpload.id, post.imageId));

      image.width = aspectRatio.width;
      image.height = aspectRatio.height;
    }

    return {
      id: post.imageId,
      imageLink: null,
      imageUrl: `https://img.wonderful.dev/img/${image.id}`,
      width: image.width,
      height: image.height,
    };
  }

  if (post.imageId.startsWith('preview_')) {
    const image = await db.query.SocialPreviewImage.findFirst({
      columns: { url: true },
      where: eq(SocialPreviewImage.imageId, post.imageId),
    });
    if (!image) {
      return null;
    }

    return {
      id: post.imageId,
      imageLink: image.url,
      imageUrl: `https://img.wonderful.dev/link/${post.imageId}`,
      width: 0,
      height: 0,
    };
  }

  throw Error(`Unknown image id prefix from Post(${post.id}): ${post.imageId}`);
};

export const getImageForPost = async (currentUserId: string, content: string, imageId?: string | null) => {
  if (!imageId) {
    return;
  }

  if (imageId.startsWith('image_')) {
    const img = await db.query.UserImageUpload.findFirst({
      columns: { id: true },
      where: and(eq(UserImageUpload.id, imageId), eq(UserImageUpload.userId, currentUserId)),
    });
    if (!img) {
      return;
    }
    return {
      id: img.id,
      key: `img/${img.id}`,
    };
  }

  if (imageId.startsWith('preview_')) {
    const firstLink = getFirstLinkFromPostContent(content);
    if (!firstLink) {
      return;
    }
    const externalLink = makeExternalUrl(firstLink);
    if (!externalLink) {
      return;
    }
    const img = await db.query.SocialPreviewImage.findFirst({
      columns: { imageId: true },
      where: eq(SocialPreviewImage.url, externalLink),
    });
    if (!img) {
      return;
    }
    return {
      id: img.imageId,
    };
  }
};

const getVerifiedReposFromPostContent = async (content: string) => {
  const _repos = getReposFromPostContent(content);
  if (_repos.length === 0) {
    return [];
  }

  const repos = (
    await db.query.IntegrationRepo.findMany({
      columns: { fullName: true },
      where: inArray(IntegrationRepo.fullName, _repos),
    })
  ).map((repo) => repo.fullName.toLowerCase());
  if (repos.length === 0) {
    return [];
  }

  return _repos.filter((repo) => repos.includes(repo.toLowerCase()));
};

const getVerifiedRepoIssuesFromPostContent = async (content: string) => {
  const _issues = getRepoIssuesFromPostContent(content);
  if (_issues.length === 0) {
    return [];
  }

  const repos = (
    await db.query.IntegrationRepo.findMany({
      columns: { fullName: true },
      where: inArray(
        IntegrationRepo.fullName,
        _issues.map((issue) => issue.split('#')[0]).filter((item) => item !== undefined),
      ),
    })
  ).map((repo) => repo.fullName.toLowerCase());
  if (repos.length === 0) {
    return [];
  }

  return _issues.filter((issue) => {
    const repo = issue.split('#')[0]?.toLowerCase();
    if (!repo) {
      return false;
    }
    return repos.includes(repo);
  });
};

export const getPostReplyThread = async (postId: string, depth = 3) => {
  let currentPostId: string | null = postId;
  const thread: (typeof Post.$inferSelect)[] = [];
  let hasMore = false;

  while (currentPostId) {
    const [firstReply] = await db
      .select()
      .from(Post)
      .where(eq(Post.parentId, currentPostId))
      .orderBy(asc(Post.postedAt), desc(Post.id))
      .limit(1);

    if (firstReply) {
      if (thread.length < depth) {
        thread.push(firstReply);
        currentPostId = firstReply.id;
      } else {
        hasMore = true;
        currentPostId = null;
      }
    } else {
      currentPostId = null;
    }
  }

  return { thread, hasMore };
};

export const getTimelineFeedItem = async (post: typeof Post.$inferSelect, currentUserId?: string): Promise<TimelineFeedItemType> => {
  const getReply = async (): Promise<TimelineFeedItemType['reply']> => {
    let root: PublicPost | null = null;
    let parent: PublicPost | null = null;

    if (post.parentId) {
      parent = await getPublicPostById(post.parentId, currentUserId);
    }
    if (!parent) {
      return;
    }
    if (post.rootParentId) {
      if (post.rootParentId === post.parentId) {
        root = parent;
      } else {
        root = await getPublicPostById(post.rootParentId, currentUserId);
      }
    }
    if (!root) {
      return;
    }
    return { parent, root };
  };
  const [publicPost, reply] = await Promise.all([postToPublicPost(post, currentUserId), getReply()]);
  return { post: publicPost, reply };
};
