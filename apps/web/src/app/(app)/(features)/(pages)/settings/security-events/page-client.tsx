'use client';

import EventItem from '@acme/ui/components/event-item';
import TitleBar from '@acme/ui/components/title-bar';
import { Button } from '@acme/ui/components/ui/button';
import { LuLoaderCircle } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function PageClient() {
  return (
    <>
      <TitleBar title="Security Events" />
      <SecurityEventsList />
      <div className="h-48"></div>
    </>
  );
}

function SecurityEventsList() {
  const securityEventsQuery = api.securityEvents.getEvents.useInfiniteQuery(
    {},
    {
      getNextPageParam: (page) => page.nextCursor,
    },
  );

  if (securityEventsQuery.isPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (securityEventsQuery.isError) {
    return <p>{securityEventsQuery.error.message}</p>;
  }

  return (
    <div>
      {securityEventsQuery.data.pages.map((page) => page.items.map((item) => <EventItem key={item.id} {...item} />))}
      <div className="flex items-center justify-center p-4">
        {securityEventsQuery.hasNextPage ? (
          <Button onClick={() => securityEventsQuery.fetchNextPage()} disabled={securityEventsQuery.isFetchingNextPage} variant="outline">
            {securityEventsQuery.isFetchingNextPage && <LuLoaderCircle className="animate-spin" />}
            Load More
          </Button>
        ) : (
          <p className="text-muted-foreground text-center">No more events to show</p>
        )}
      </div>
    </div>
  );
}
