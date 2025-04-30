'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import { api } from '~/trpc/client';

export default function StarredList({ companyId }: { companyId: string }) {
  const { ref, inView } = useInView();

  const starredQuery = api.companies.getStarred.useInfiniteQuery(
    { companyId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && starredQuery.hasNextPage && !starredQuery.isFetchingNextPage) {
      void starredQuery.fetchNextPage();
    }
  }, [inView, starredQuery]);

  if (starredQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (starredQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{starredQuery.error.message}</p>
      </div>
    );
  }

  if ((starredQuery.data.pages[0]?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No stars given yet.</p>
      </div>
    );
  }

  return (
    <div>
      {starredQuery.data.pages.map((page) => page.items.map((user) => <NewUserListItem user={user} key={user.id} />))}
      {starredQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
