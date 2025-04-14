'use client';

import type { IntegrationIdentifier } from '@acme/db/schema';
import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import { useLeadersFilterOptions } from '~/stores/leaders-filter-options-store';
import { api } from '~/trpc/client';

export default function TopUsersList({ provider }: { provider: IntegrationIdentifier }) {
  const { ref, inView } = useInView();
  const filter = useLeadersFilterOptions();
  const topUsersQuery = api.leaders.topUsersForIntegration.useInfiniteQuery(
    { filter, provider },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && topUsersQuery.hasNextPage && !topUsersQuery.isFetchingNextPage) {
      void topUsersQuery.fetchNextPage();
    }
  }, [inView, topUsersQuery]);

  if (topUsersQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (topUsersQuery.isError) {
    return (
      <div className="text-muted-foreground p-4">
        <p>{topUsersQuery.error.message}</p>
      </div>
    );
  }

  if ((topUsersQuery.data.pages.at(0)?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div>
      {topUsersQuery.data.pages.map((page) => page.items.map((user) => <NewUserListItem user={user} key={user.id} />))}
      {topUsersQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
