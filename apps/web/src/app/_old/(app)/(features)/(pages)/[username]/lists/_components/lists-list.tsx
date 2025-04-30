'use client';

import { formatNumber, getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import Link from 'next/link';
import pluralize from 'pluralize';
import { LuList, LuLoaderCircle, LuUser } from 'react-icons/lu';

import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function ListsList({ username }: { username: string }) {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const listsQuery = api.list.getListsForUser.useInfiniteQuery(
    { username },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (listsQuery.isPending || isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (listsQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{listsQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {currentUser && username === currentUser.username ? (
        <div className="p-4">
          <h2 className="text-xl font-bold">Your Lists</h2>
        </div>
      ) : null}
      {(listsQuery.data.pages.at(0)?.items.length ?? 0) === 0 ? (
        currentUser && username === currentUser.username ? (
          <div className="p-4 pt-0">
            <p className="text-muted-foreground">You haven&apos;t created or followed any Lists. When you do, they&apos;ll show up here.</p>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-2xl font-bold">@{username} hasn&apos;t created any Lists</p>
            <p className="text-muted-foreground mt-2">When they do, they’ll show up here.</p>
          </div>
        )
      ) : (
        <div>
          {listsQuery.data.pages.map((page) =>
            page.items.map((list) => {
              const iAmOwner = !!currentUser && list.userId === currentUser.id;
              return (
                <div className="group relative" key={list.id}>
                  <Link
                    className="group-focus-within:bg-secondary/50 group-hover:bg-secondary/50 absolute inset-0"
                    href={`/lists/${list.id}`}
                  />
                  <div className="pointer-events-none relative flex items-center gap-4 px-4 py-2">
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                      <LuList className="text-muted-foreground h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{list.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {' • '}
                          {formatNumber(list.membersCount)} {pluralize('member', list.membersCount)}
                        </p>
                      </div>
                      {iAmOwner ? (
                        <Link
                          className="group/user peer pointer-events-auto inline-flex items-center gap-2 text-sm outline-none"
                          href={list.user.url}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={list.user.avatarUrl} />
                            <AvatarFallback>
                              <LuUser className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium group-focus/user:underline hover:underline">{getUserDisplayName(list.user)}</span>
                          <span className="text-muted-foreground">{getUserDisplayUsername(list.user)}</span>
                        </Link>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          {formatNumber(list.followersCount)} {pluralize('follower', list.followersCount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
