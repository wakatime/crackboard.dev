import { getUserByUsername } from '@acme/core/backend/auth';
import { APP_NAME } from '@acme/core/constants';
import { getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { userToPublicUserCached } from '~/utils/server';

import StarsList from './_components/stars-list';

interface Props {
  params: Promise<{
    username: string;
  }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    return {};
  }

  const publicUser = await userToPublicUserCached(user);

  return {
    title: `Companies who’ve starred ${getUserDisplayName(publicUser)} (${getUserDisplayUsername(publicUser)}) - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function StarsPage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  return <StarsList userId={user.id} />;
}
