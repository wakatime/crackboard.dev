'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import { api } from '~/trpc/client';

export default function FollowersList({ userId }: { userId: string }) {
  const { ref, inView } = useInView();

  const followersQuery = api.users.getFollowers.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && followersQuery.hasNextPage && !followersQuery.isFetchingNextPage) {
      void followersQuery.fetchNextPage();
    }
  }, [inView, followersQuery]);

  if (followersQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (followersQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{followersQuery.error.message}</p>
      </div>
    );
  }

  if ((followersQuery.data.pages[0]?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No followers yet.</p>
      </div>
    );
  }

  return (
    <div>
      {followersQuery.data.pages.map((page) => page.items.map((follower) => <NewUserListItem user={follower} key={follower.id} />))}
      {followersQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
