import { db, eq } from '@acme/db/drizzle';
import { Post, User, UserWatchPost } from '@acme/db/schema';
import { z } from 'zod';

import { wakaq } from '..';
import { notifyPostWatchers } from './notifyPostWatchers';

export const afterVoted = wakaq.task(
  async (postId: unknown, userId: unknown) => {
    const result = z.string().safeParse(postId);
    if (!result.success) {
      wakaq.logger?.error(result.error.message);
      return;
    }
    const post = await db.query.Post.findFirst({
      columns: { id: true, rootParentId: true },
      where: eq(Post.id, result.data),
    });
    if (!post) {
      return;
    }
    const userRes = z.string().safeParse(userId);
    if (!userRes.success) {
      wakaq.logger?.error(userRes.error.message);
      return;
    }
    const user = await db.query.User.findFirst({ where: eq(User.id, userRes.data) });
    if (!user) {
      return;
    }

    await db.insert(UserWatchPost).values({ postId: post.id, userId: user.id }).onConflictDoNothing();

    // also watch root parent Post
    if (post.rootParentId) {
      await db.insert(UserWatchPost).values({ postId: post.rootParentId, userId: user.id }).onConflictDoNothing();
    }

    await notifyPostWatchers.enqueue(post.id);
  },
  { name: 'afterVoted' },
);
