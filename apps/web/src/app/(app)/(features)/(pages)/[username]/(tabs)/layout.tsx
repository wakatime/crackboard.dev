import { getUserByUsername } from '@acme/core/backend/auth';
import { getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import TitleBar from '@acme/ui/components/title-bar';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { userToPublicUserCached } from '~/utils/server';

import DevProfileTabs from './_components/dev-profile-tabs';

interface Props {
  children: ReactNode;
  params: Promise<{ username: string }>;
}

export default async function UserTabsLayout({ children, params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }
  const publicUser = await userToPublicUserCached(user);
  return (
    <>
      <TitleBar
        bottom={<DevProfileTabs user={publicUser} />}
        title={
          <div className="flex-1">
            <p className="line-clamp-1 text-lg font-bold leading-6">{getUserDisplayName(publicUser)}</p>
            <p className="text-muted-foreground line-clamp-1 text-sm leading-4">{getUserDisplayUsername(publicUser)}</p>
          </div>
        }
      />
      {children}
      <div className="h-48"></div>
    </>
  );
}
