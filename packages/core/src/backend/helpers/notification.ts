import { eq } from '@acme/db';
import { db } from '@acme/db/drizzle';
import type { CompanyUserNotification, UserNotification } from '@acme/db/schema';
import { Company, Job, Post, User } from '@acme/db/schema';

import { BASE_URL } from '../../constants';
import type { PublicCompanyUserNotification, PublicUser, PublicUserNotification } from '../../types';
import { companyToPublicCompany } from './company';
import { getIsMyPost, getPublicPostUrl } from './post';
import { userToAnonymousUser, userToPublicUser } from './user';

export const getPublicNotification = async (
  notification: typeof UserNotification.$inferSelect & {
    actor?: typeof User.$inferSelect | null;
    post?:
      | (typeof Post.$inferSelect & {
          parent?: { id: string; postedBy: { id: string; username: string | null } } | null;
          rootParent?: { id: string; postedBy: { id: string; username: string | null } } | null;
          postedBy: { id: string; username: string | null };
        })
      | null;
    company?: typeof Company.$inferSelect | null;
  },
  currentUserId?: string,
): Promise<PublicUserNotification> => {
  const isAnonymous = notification.post?.isAnonymous;
  let url: string | null = null;

  if (notification.reason === 'starred' && notification.company) {
    url = `${BASE_URL}/c/${notification.company.slug}`;
  } else if (notification.post) {
    url = getPublicPostUrl(notification.post);
  }

  let actor = notification.actor
    ? isAnonymous
      ? await userToAnonymousUser(notification.actor, notification.post)
      : await userToPublicUser(notification.actor)
    : null;

  const recentReactions = notification.reason === 'reaction' ? (notification.metadata?.recentReactions ?? []) : [];

  if (!actor && recentReactions.length === 1) {
    const r = recentReactions[0];
    if (r) {
      const user = await db.query.User.findFirst({ where: eq(User.id, r.userId) });
      if (user) {
        actor = await userToPublicUser(user);
      }
    }
  }

  return {
    actorId: notification.actorId,
    createdAt: notification.createdAt,
    id: notification.id,
    metadata: notification.metadata,
    postId: notification.postId,
    readAt: notification.readAt,
    reason: notification.reason,
    userId: notification.userId,
    companyId: notification.companyId,
    url,
    post: notification.post
      ? {
          isMyPost: getIsMyPost(notification.post, currentUserId),
          parent: notification.post.parent
            ? {
                id: notification.post.parent.id,
                postedBy: notification.post.parent.postedBy,
                isMyPost: getIsMyPost({ postedById: notification.post.parent.postedBy.id }, currentUserId),
              }
            : null,
          rootParent: notification.post.rootParent
            ? {
                id: notification.post.rootParent.id,
                postedBy: notification.post.rootParent.postedBy,
                isMyPost: getIsMyPost({ postedById: notification.post.rootParent.postedBy.id }, currentUserId),
              }
            : null,
          postedBy: notification.post.postedBy,
        }
      : undefined,
    actor,
    actors:
      !actor && recentReactions.length > 1
        ? ((
            await Promise.all(
              recentReactions
                .filter((r, i, arr) => r.userId !== notification.userId && arr.map((x) => x.userId).indexOf(r.userId) === i)
                .map(async (r) => {
                  const u = await db.query.User.findFirst({ where: eq(User.id, r.userId) });
                  if (!u) {
                    return;
                  }
                  return await userToPublicUser(u);
                }),
            )
          ).filter(Boolean) as PublicUser[])
        : [],
    company: notification.company ? await companyToPublicCompany(notification.company) : null,
  };
};

export const getPublicCompanyUserNotification = async (
  notification: typeof CompanyUserNotification.$inferSelect & {
    devActor?: typeof User.$inferSelect | null;
  },
): Promise<PublicCompanyUserNotification> => {
  // const isAnonymous = notification.post?.isAnonymous;
  let url: string | null = null;
  let job: PublicCompanyUserNotification['job'] = null;

  if (notification.reason === 'starredJob' && notification.metadata) {
    const jobId = (notification.metadata as { job?: { id?: string } }).job?.id;
    if (jobId) {
      const [row] = await db
        .select({
          title: Job.title,
          description: Job.description,
          companySlug: Company.slug,
        })
        .from(Job)
        .innerJoin(Company, eq(Company.id, Job.companyId))
        .where(eq(Job.id, jobId));
      if (row) {
        url = `${BASE_URL}/c/${row.companySlug}/jobs/${jobId}`;
        job = {
          title: row.title,
          shortDescription: row.description.slice(0, 100) + '...',
        };
      }
    }
  } else if (notification.reason === 'starredCompany') {
    const companyId = (notification.metadata as { company?: { id?: string } }).company?.id;
    if (companyId) {
      const [row] = await db
        .select({
          slug: Company.slug,
        })
        .from(Company)
        .where(eq(Company.id, companyId));
      if (row) {
        url = `${BASE_URL}/c/${row.slug}`;
      }
    }
  } else if (notification.reason === 'mentionedCompany') {
    const postId = (notification.metadata as { post?: { id?: string } }).post?.id;
    if (postId) {
      const [row] = await db
        .select({
          id: Post.id,
        })
        .from(Post)
        .where(eq(Post.id, postId));
      if (row) {
        url = `${BASE_URL}/post/${row.id}`;
      }
    }
  }

  return {
    devActor: notification.devActor ? await userToPublicUser(notification.devActor) : null,
    // companyUserActor: notification.user ? await companyUserToPublicCompanyUser(notification.user) : null,
    devUserActorId: notification.devUserActorId,
    companyUserActorId: notification.companyUserActorId,
    companyId: notification.companyId,
    jobId: notification.jobId,
    createdAt: notification.createdAt,
    id: notification.id,
    metadata: notification.metadata,
    readAt: notification.readAt,
    reason: notification.reason,
    userId: notification.userId,
    url,
    job,
  };
};
