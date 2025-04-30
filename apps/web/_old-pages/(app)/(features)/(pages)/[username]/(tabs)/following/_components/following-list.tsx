'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import { api } from '~/trpc/client';

export default function FollowingList({ userId }: { userId: string }) {
  const { ref, inView } = useInView();

  const followingQuery = api.users.getFollowing.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && followingQuery.hasNextPage && !followingQuery.isFetchingNextPage) {
      void followingQuery.fetchNextPage();
    }
  }, [inView, followingQuery]);

  if (followingQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (followingQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{followingQuery.error.message}</p>
      </div>
    );
  }

  if ((followingQuery.data.pages[0]?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Not following anyone yet.</p>
      </div>
    );
  }

  return (
    <div>
      {followingQuery.data.pages.map((page) => page.items.map((user) => <NewUserListItem user={user} key={user.id} />))}
      {followingQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
