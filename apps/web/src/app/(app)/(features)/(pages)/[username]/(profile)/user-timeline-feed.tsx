'use client';

import { Duration } from 'ts-duration';

import RenderTimeline from '~/components/RenderTimeline';
import { useAppStore } from '~/stores/app-store';
import { api } from '~/trpc/client';

export default function UserTimelineFeed({ userId }: { userId: string }) {
  const timestamp = useAppStore((state) => state.timestamp);
  const topQuery = api.timeline.getProfileTimeline.useInfiniteQuery(
    { timelineDirection: 'asc', timestamp: timestamp?.toISOString(), userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: Duration.minute(1).milliseconds,
      refetchOnWindowFocus: true,
    },
  );
  const bottomQuery = api.timeline.getProfileTimeline.useInfiniteQuery(
    { timelineDirection: 'desc', timestamp: timestamp?.toISOString(), userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: Duration.minute(15).milliseconds,
    },
  );

  return (
    <RenderTimeline
      bottomPages={bottomQuery.data?.pages ?? []}
      bottomHasMore={bottomQuery.hasNextPage}
      bottomLoading={bottomQuery.isPending}
      refetchBottomList={() => bottomQuery.refetch()}
      topPages={topQuery.data?.pages ?? []}
      topHasMore={topQuery.hasNextPage}
      topLoading={topQuery.isPending}
      refetchTopList={() => topQuery.refetch()}
      onBottomReach={() => {
        if (bottomQuery.hasNextPage && !bottomQuery.isFetchingNextPage) {
          void bottomQuery.fetchNextPage();
        }
      }}
    />
  );
}
