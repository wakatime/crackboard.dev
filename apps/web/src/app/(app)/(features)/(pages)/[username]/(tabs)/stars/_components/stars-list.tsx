'use client';

import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect, useMemo } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import CompanyRow from '~/components/company-row';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function StarsList({ userId }: { userId: string }) {
  const { isLoading: _isAuthLoading, currentUser: _ } = useAuth();
  const { ref, inView } = useInView();

  const starsQuery = api.users.getStars.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const haveNextPage = useMemo(() => !!starsQuery.data?.pages.at(-1)?.nextCursor, [starsQuery.data?.pages]);

  useEffect(() => {
    if (inView && haveNextPage && !starsQuery.isFetching) {
      void starsQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, starsQuery]);

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
        <p className="text-muted-foreground">No stars yet</p>
      </div>
    );
  }

  return (
    <div>
      {starsQuery.data.pages.map((page) => page.items.map((company) => <CompanyRow company={company} key={company.id} />))}
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
