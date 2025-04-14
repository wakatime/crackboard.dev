'use client';

import ChatThreadRow, { ChatRowSkeleton } from '@acme/ui/components/ChatThreadRow';
import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import { api } from '~/trpc/client';

const ChatsList = () => {
  const { ref, inView } = useInView();

  const {
    data: chatThreads,
    isPending,
    isError,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.chat.getChatThreads.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: true,
    },
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  if (isPending) {
    return (
      <div>
        <ChatRowSkeleton />
        <ChatRowSkeleton />
        <ChatRowSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {chatThreads.pages.map((page) =>
        page.threads.map((thread) => {
          return <ChatThreadRow key={thread.id} thread={thread} url={`/chats/${thread.id}`} />;
        }),
      )}

      {hasNextPage ? (
        <div className="flex h-48 items-center justify-center" ref={ref}>
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </div>
  );
};

export default ChatsList;
