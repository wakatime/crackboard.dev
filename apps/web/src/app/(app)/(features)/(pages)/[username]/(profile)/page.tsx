import { authenticatedUserFromRequest, getUserByUsername } from '@acme/core/backend/auth';
import { APP_NAME } from '@acme/core/constants';
import { parseBioFromGPT } from '@acme/core/integrations/backend';
import { formatNumberWithSuffix, getUserDisplayName } from '@acme/core/utils';
import { db, desc, eq, sql } from '@acme/db/drizzle';
import { OpenaiResult } from '@acme/db/schema';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';
import { notFound, redirect, RedirectType } from 'next/navigation';
import type { ChatCompletion } from 'openai/resources/index';

import DrawerToggleButton from '~/components/DrawerToggleButton';
import { getAvatarForUserCached, getNameForUserCached, userToPublicUserCached } from '~/utils/server';

import PageClient from './page-client';

interface Props {
  params: Promise<{ username: string }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    return {};
  }
  const [name, avatarUrl] = await Promise.all([getNameForUserCached(user), getAvatarForUserCached(user)]);
  return {
    openGraph: {
      images: [avatarUrl],
    },
    title: user.username ? `${name ?? user.username} (@${user.username}) - ${APP_NAME}` : `${user.id} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const currentUser = await authenticatedUserFromRequest();

  if (username === 'me') {
    if (currentUser) {
      redirect(`/${currentUser.username ?? currentUser.id}`, RedirectType.replace);
    } else {
      notFound();
    }
  }

  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const profile = await userToPublicUserCached(user, currentUser?.id);

  const bio = await db.query.OpenaiResult.findFirst({
    orderBy: [sql`${OpenaiResult.isSelectedBio} desc nulls last`, desc(OpenaiResult.createdAt)],
    where: eq(OpenaiResult.userId, user.id),
  });
  if (bio) {
    profile.bio = parseBioFromGPT(bio.response as ChatCompletion);
  }

  return (
    <>
      <TitleBar
        leading={<DrawerToggleButton />}
        hideBackButton
        title={
          <>
            <p className="truncate text-lg font-bold leading-6">{getUserDisplayName(profile)}</p>
            <p className="text-muted-foreground truncate text-sm leading-4">
              {formatNumberWithSuffix(profile.totalPosts, 'post')}, {formatNumberWithSuffix(profile.totalReplies, 'reply')},{' '}
              {formatNumberWithSuffix(profile.totalPolls, 'poll')}
            </p>
          </>
        }
      />
      <PageClient user={profile} />
    </>
  );
}
