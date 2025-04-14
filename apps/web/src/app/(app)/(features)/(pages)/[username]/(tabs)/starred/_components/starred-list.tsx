'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect, useMemo } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import CompanyRow from '~/components/company-row';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function StarredList({ userId }: { userId: string }) {
  const { isLoading: _isAuthLoading, currentUser: _ } = useAuth();
  const { ref, inView } = useInView();

  const starredQuery = api.users.getStarred.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const haveNextPage = useMemo(() => !!starredQuery.data?.pages.at(-1)?.nextCursor, [starredQuery.data?.pages]);

  useEffect(() => {
    if (inView && haveNextPage && !starredQuery.isFetching) {
      void starredQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, starredQuery]);

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
        <p className="text-muted-foreground">No stars yet</p>
      </div>
    );
  }

  return (
    <div>
      {starredQuery.data.pages.map((page) => page.items.map((company) => <CompanyRow company={company} key={company.id} />))}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="animate-spin" size={24} />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center px-4 text-center" />
      )}
    </div>
  );
}
