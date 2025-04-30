'use client';

import type { PublicUser } from '@acme/core/types';
import { useParams } from 'next/navigation';

import FloatingCreatePostButton from '~/components/FloatingCreatePostButton';
import { api } from '~/trpc/client';

import ProfileDetails from './profile-details';
import ProfileDetailsLoader from './profile-details-loader';
import UserTimelineFeed from './user-timeline-feed';

export default function PageClient({ user }: { user?: PublicUser }) {
  const { username } = useParams<{ username: string }>();

  const profileQuery = api.users.publicProfileInfo.useQuery(username, { initialData: user, placeholderData: user });

  if (profileQuery.isPending) {
    return <ProfileDetailsLoader />;
  }

  if (profileQuery.isError) {
    return (
      <div className="text-muted-foreground p-4">
        <p>{profileQuery.error.message}</p>
      </div>
    );
  }

  return (
    <>
      <ProfileDetails user={profileQuery.data} />
      {profileQuery.data.isBlocked ? (
        <div className="text-muted-foreground p-4">
          <p>Posts hidden</p>
        </div>
      ) : (
        <UserTimelineFeed userId={profileQuery.data.id} />
      )}

      <FloatingCreatePostButton />

      <div className="h-48"></div>
    </>
  );
}
