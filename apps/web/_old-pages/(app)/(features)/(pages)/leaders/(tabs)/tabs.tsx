'use client';

import { cn } from '@acme/ui/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const tabs: { id: string; label: string }[] = [
  {
    id: 'integration',
    label: 'Integration',
  },
  {
    id: 'language',
    label: 'Language',
  },
];

export default function LeadersTabs() {
  const pathname = usePathname();
  const selectedTab = useMemo(() => pathname.split('/').at(2), [pathname]);

  return (
    <Tabs value={selectedTab}>
      <TabsList className="flex h-12">
        {tabs.map((tab) => {
          const selected = tab.id === selectedTab;
          return (
            <TabsTrigger asChild key={tab.id} value={tab.id}>
              <Link
                className={cn(
                  'text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground relative flex flex-1 items-center justify-center',
                  {
                    'text-accent-foreground': selected,
                  },
                )}
                href={`/leaders/${tab.id}`}
                replace
              >
                <div className="relative flex h-full items-center">
                  {tab.label}
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
