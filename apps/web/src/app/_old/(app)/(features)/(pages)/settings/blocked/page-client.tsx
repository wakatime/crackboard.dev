'use client';

import TitleBar from '@acme/ui/components/title-bar';
import UserListSkeleton from '@acme/ui/components/UserListSkeleton';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import NewUserListItem from '~/components/NewUserListItem';
import UserBlockUnblockButton from '~/components/UserBlockUnblockButton';
import { api } from '~/trpc/client';

export default function PageClient() {
  return (
    <>
      <TitleBar title="Blocked Accounts" homeHref="/settings" />
      <BlockedAccountsList />
      <div className="h-48"></div>
    </>
  );
}

function BlockedAccountsList() {
  const { ref, inView } = useInView();

  const blockedAccountsListQuery = api.users.getBlockedUsers.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && blockedAccountsListQuery.hasNextPage && !blockedAccountsListQuery.isFetchingNextPage) {
      void blockedAccountsListQuery.fetchNextPage();
    }
  }, [inView, blockedAccountsListQuery]);

  if (blockedAccountsListQuery.isPending) {
    return <UserListSkeleton />;
  }

  if (blockedAccountsListQuery.isError) {
    return <div className="text-muted-foreground p-4">{blockedAccountsListQuery.error.message}</div>;
  }

  if ((blockedAccountsListQuery.data.pages[0]?.items.length ?? 0) === 0) {
    return <div className="text-muted-foreground p-4">You haven't blocked anyone yet</div>;
  }

  return (
    <div>
      {blockedAccountsListQuery.data.pages.map((page) =>
        page.items.map((user) => <NewUserListItem key={user.id} user={user} action={<UserBlockUnblockButton user={user} />} />),
      )}
      {blockedAccountsListQuery.hasNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
