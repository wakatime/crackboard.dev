'use client';

import type { PublicUser } from '@acme/core/types';
import { getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import type { PublicCompany } from '@acme/db/schema';
import CompanyAvatar from '@acme/ui/components/company-avatar';
import SearchKeyboardShortcutBadge from '@acme/ui/components/search-keyboard-shortcut-badge';
import TitleBar from '@acme/ui/components/title-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Button } from '@acme/ui/components/ui/button';
import { Input } from '@acme/ui/components/ui/input';
import { toast } from '@acme/ui/components/ui/sonner';
import { useSearchBarFocus } from '@acme/ui/hooks/use-searchbar-focus';
import { keepPreviousData } from '@tanstack/react-query';
import { notFound, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LuLoaderCircle, LuSearch, LuUser } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';
import { useDebounceValue } from 'usehooks-ts';

import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function PageClient() {
  const [queryText, setQueryText] = useState('');
  const searchInputRef = useSearchBarFocus();
  const { ref, inView } = useInView();

  const { currentUser } = useAuth();

  if (!currentUser) {
    notFound();
  }

  const [debouncedQueryText] = useDebounceValue(queryText, 300);

  const {
    data: companiesAndDevs,
    isPending,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = api.users.getStarsAndFollowers.useInfiniteQuery(
    { userId: currentUser.id, query: debouncedQueryText },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      placeholderData: keepPreviousData,
    },
  );
  const router = useRouter();
  const utils = api.useUtils();
  const createOrGetThreadMut = api.chat.createOrGetThread.useMutation({
    onSuccess: (thread) => {
      void utils.chat.getChatThreads.invalidate();
      router.push(`/chats/${thread.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create thread', { description: error.message });
    },
  });

  const handleCreateOrGetThread = useCallback(
    (type: 'company' | 'user', companyOrDev: PublicCompany | PublicUser) => {
      if (createOrGetThreadMut.isPending) {
        return;
      }
      const payload = type === 'company' ? { companyId: companyOrDev.id } : { userId: companyOrDev.id };
      createOrGetThreadMut.mutate(payload);
    },
    [createOrGetThreadMut],
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <>
      <TitleBar
        homeHref="/chats"
        title="New Chat"
        bottom={
          <div className="p-4 pt-0">
            <fieldset className="relative flex-1">
              <Input
                placeholder="Search for a company or user"
                className="peer w-full pl-8"
                value={queryText}
                onChange={(e) => setQueryText(e.currentTarget.value)}
                ref={searchInputRef}
                autoFocus
              />
              <LuSearch className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <SearchKeyboardShortcutBadge />
            </fieldset>
          </div>
        }
      />
      <div className="grid">
        {companiesAndDevs.pages.map((page) =>
          page.items.map((companyOrDev) => {
            if (companyOrDev.type === 'user') {
              const user = companyOrDev.data;

              const subtext =
                user.isFollowing && user.doesFollowMe
                  ? 'You follow each other'
                  : user.isFollowing
                    ? 'Following'
                    : user.doesFollowMe
                      ? 'User follows you'
                      : null;

              return (
                <Button
                  variant="ghost"
                  className="h-fit justify-start gap-4 rounded-none p-4 text-left text-base"
                  key={user.id}
                  disabled={createOrGetThreadMut.isPending || createOrGetThreadMut.isSuccess}
                  onClick={() => handleCreateOrGetThread('user', user)}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage
                      src={user.avatarUrl}
                      style={{
                        filter: user.isBlocked ? 'blur(10px)' : undefined,
                      }}
                    />
                    <AvatarFallback>
                      <LuUser size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1">
                    <p className="truncate font-semibold leading-5">{getUserDisplayName(user)}</p>
                    <p className="text-muted-foreground flex-1 truncate text-sm">{getUserDisplayUsername(user)}</p>
                    {!!subtext && (
                      <p className="text-muted-foreground mt-1 truncate text-sm leading-4">
                        <LuUser className="inline h-4 w-4" />
                        {subtext}
                      </p>
                    )}
                  </div>
                </Button>
              );
            }
            const company = companyOrDev.data;
            const subtext =
              company.isStarred && company.hasStarredMe
                ? 'You starred each other'
                : company.isStarred
                  ? 'Starred'
                  : company.hasStarredMe
                    ? 'Company starred you'
                    : null;
            return (
              <Button
                variant="ghost"
                className="h-fit justify-start gap-4 rounded-none p-4 text-left text-base"
                key={company.id}
                disabled={createOrGetThreadMut.isPending || createOrGetThreadMut.isSuccess}
                onClick={() => handleCreateOrGetThread('company', company)}
              >
                <CompanyAvatar className="h-14 w-14" company={company} />
                <div className="grid flex-1">
                  <p className="truncate font-semibold leading-5">{company.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-sm leading-4">@{company.slug}</p>
                  {!!subtext && (
                    <p className="text-muted-foreground mt-1 truncate text-sm leading-4">
                      <LuUser className="inline h-4 w-4" />
                      {subtext}
                    </p>
                  )}
                </div>
              </Button>
            );
          }),
        )}
        <div className="flex h-48 items-center justify-center" ref={ref}>
          {isFetchingNextPage && <LuLoaderCircle className="h-6 w-6 animate-spin" />}
        </div>
      </div>
    </>
  );
}
