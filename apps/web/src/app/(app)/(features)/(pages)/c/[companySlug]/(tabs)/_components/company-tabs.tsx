'use client';

import { formatNumber } from '@acme/core/utils';
import type { PublicCompany } from '@acme/db/schema';
import { cn } from '@acme/ui/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const tabs: { id: string; label: string }[] = [
  {
    id: 'stars',
    label: 'Stars',
  },
  {
    id: 'starred',
    label: 'Starred',
  },
];

export default function CompanyTabs({ company }: { company: PublicCompany }) {
  const pathname = usePathname();
  const selectedTab = useMemo(() => pathname.split('/').at(-1), [pathname]);

  return (
    <Tabs value={selectedTab}>
      <TabsList className="flex h-12">
        {tabs.map((tab) => {
          const selected = tab.id === selectedTab;
          const count = getCount(company, tab.id);
          return (
            <TabsTrigger asChild key={tab.id} value={tab.id}>
              <Link
                className={cn(
                  'text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground relative flex flex-1 items-center justify-center',
                  {
                    'text-accent-foreground': selected,
                  },
                )}
                href={`/c/${company.slug}/${tab.id}`}
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

const getCount = (company: PublicCompany, tabId: string) => {
  if (tabId === 'starred') {
    return company.starredCount;
  }
  if (tabId === 'stars') {
    return company.starsCount;
  }
  return 0;
};
