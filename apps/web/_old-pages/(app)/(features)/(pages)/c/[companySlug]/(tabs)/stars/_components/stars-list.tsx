'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import { api } from '~/trpc/client';

export default function StarsList({ companyId }: { companyId: string }) {
  const { ref, inView } = useInView();

  const starsQuery = api.companies.getStars.useInfiniteQuery(
    { companyId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && starsQuery.hasNextPage && !starsQuery.isFetchingNextPage) {
      void starsQuery.fetchNextPage();
    }
  }, [inView, starsQuery]);

  if (starsQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (starsQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{starsQuery.error.message}</p>
      </div>
    );
  }

  if ((starsQuery.data.pages[0]?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No stars yet.</p>
      </div>
    );
  }

  return (
    <div>
      {starsQuery.data.pages.map((page) => page.items.map((user) => <NewUserListItem user={user} key={user.id} />))}
      {starsQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
