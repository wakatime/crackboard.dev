'use client';

import type { PublicUser } from '@acme/core/types';
import { formatNumber } from '@acme/core/utils';
import { cn } from '@acme/ui/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const tabs: { id: string; label: string }[] = [
  {
    id: 'followers',
    label: 'Followers',
  },
  {
    id: 'following',
    label: 'Following',
  },
  {
    id: 'stars',
    label: 'Stars',
  },
  {
    id: 'starred',
    label: 'Starred',
  },
];

export default function DevProfileTabs({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const selectedTab = useMemo(() => pathname.split('/').at(-1), [pathname]);

  return (
    <Tabs value={selectedTab}>
      <TabsList className="flex h-12">
        {tabs.map((tab) => {
          const selected = tab.id === selectedTab;
          const count = getCount(user, tab.id);
          return (
            <TabsTrigger asChild key={tab.id} value={tab.id}>
              <Link
                className={cn(
                  'text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground relative flex flex-1 items-center justify-center',
                  {
                    'text-accent-foreground': selected,
                  },
                )}
                href={`/${user.username ?? user.id}/${tab.id}`}
                replace
              >
                <div className="relative flex h-full items-center">
                  {tab.label} ({formatNumber(count)})
                  <div
                    className={cn('bg-primary absolute bottom-0 left-0 right-0 h-1 rounded-full opacity-0', {
                      'opacity-100': selected,
                    })}
                  />
                </div>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

const getCount = (user: PublicUser, tabId: string) => {
  if (tabId === 'followers') {
    return user.followersCount;
  }
  if (tabId === 'following') {
    return user.followingCount;
  }
  if (tabId === 'stars') {
    return user.starsCount;
  }
  if (tabId === 'starred') {
    return user.starredCount;
  }
  return 0;
};
