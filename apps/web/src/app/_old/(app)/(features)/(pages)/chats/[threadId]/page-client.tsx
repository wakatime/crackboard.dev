'use client';

import 'core-js/features/array/to-reversed';

import type { Message, PublicUser } from '@acme/core/types';
import { formatNumberWithSuffix, getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import type { PublicCompany } from '@acme/db/schema';
import Chatbox from '@acme/ui/components/chatbox';
import CompanyAvatar from '@acme/ui/components/company-avatar';
import TitleBar from '@acme/ui/components/title-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Button } from '@acme/ui/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@acme/ui/components/ui/hover-card';
import { toast } from '@acme/ui/components/ui/sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuLoaderCircle, LuSend, LuUser } from 'react-icons/lu';
import { RichTextarea } from 'rich-textarea';

import HoverCompanyDetailsCard from '~/components/HoverCompanyDetailsCard';
import HoverProfileDetailsCard from '~/components/HoverProfileDetailsCard';
import LanguageBadgesList from '~/components/LanguageBadgesList';
import { useAuth } from '~/providers/AuthProvider';
import { useBadges } from '~/providers/BadgesProvider';
import type { RouterOutputs } from '~/trpc/client';
import { api } from '~/trpc/client';

export default function PageClient() {
  const { threadId } = useParams<{ threadId: string }>();
  const chatThreadQuery = api.chat.getChatThread.useQuery(threadId);

  if (chatThreadQuery.isPending) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <LuLoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  if (chatThreadQuery.isError) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <p>{chatThreadQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-screen min-h-0 flex-1 flex-col">
      <TitleBar
        homeHref="/chats"
        title={
          <div className="flex items-center gap-4">
            {chatThreadQuery.data.company && (
              <>
                <CompanyAvatar company={chatThreadQuery.data.company} />
                <div className="flex">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <p className="truncate font-semibold">{chatThreadQuery.data.company.name}</p>
                    </HoverCardTrigger>
                    <HoverCardContent className="pointer-events-auto">
                      <HoverCompanyDetailsCard company={chatThreadQuery.data.company} />
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </>
            )}
            {chatThreadQuery.data.user && (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={chatThreadQuery.data.user.avatarUrl}
                    style={{
                      filter: chatThreadQuery.data.user.isBlocked ? 'blur(10px)' : undefined,
                    }}
                  />
                  <AvatarFallback>
                    <LuUser size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="flex">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <p className="truncate font-semibold">{getUserDisplayName(chatThreadQuery.data.user)}</p>
                    </HoverCardTrigger>
                    <HoverCardContent className="pointer-events-auto">
                      <HoverProfileDetailsCard profile={chatThreadQuery.data.user} />
                    </HoverCardContent>
                  </HoverCard>
                  {chatThreadQuery.data.user.username && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <p className="text-muted-foreground ml-2 mt-0.5 line-clamp-1 text-sm">
                          {getUserDisplayUsername(chatThreadQuery.data.user)}
                        </p>
                      </HoverCardTrigger>
                      <HoverCardContent className="pointer-events-auto">
                        <HoverProfileDetailsCard profile={chatThreadQuery.data.user} />
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </>
            )}
          </div>
        }
      />
      <RenderThread chatThread={chatThreadQuery.data} />
    </div>
  );
}

function RenderThread({ chatThread }: { chatThread: RouterOutputs['chat']['getChatThread'] }) {
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();
  const { markChatThreadRead } = useBadges();

  const utils = api.useUtils();

  const sendMessageMut = api.chat.sendChatMessage.useMutation({
    onMutate: (vars) => {
      utils.chat.getMessages.setInfiniteData({ threadId: vars.threadId }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page, i) => ({
                ...page,
                items:
                  i === 0
                    ? [
                        {
                          id: `temp-${crypto.randomUUID()}`,
                          fromCompany: null,
                          fromCompanyId: null,
                          fromCompanyUserId: null,
                          fromUser: currentUser ?? null,
                          fromUserId: currentUser?.id ?? null,
                          sentAt: new Date(),
                          text: vars.text,
                          threadId: vars.threadId,
                        } satisfies RouterOutputs['chat']['getMessages']['items'][number],
                        ...page.items,
                      ]
                    : page.items,
              })),
            }
          : undefined,
      );
    },
    onError: (error) => {
      toast.error('Failed to send message', { description: error.message });
    },
    onSettled: () => {
      void utils.chat.getMessages.invalidate();
    },
  });

  const messagesQuery = api.chat.getMessages.useInfiniteQuery(
    { threadId: chatThread.id },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: sendMessageMut.isPending ? false : 3000,
    },
  );

  const messages = useMemo(() => {
    if (!messagesQuery.isSuccess) {
      return [];
    }
    const messages = messagesQuery.data.pages
      .flatMap((page) => page.items)
      .map(
        (message) =>
          ({
            id: message.id,
            text: message.text,
            sentAt: message.sentAt,
            senderId: message.fromUserId ?? message.fromCompanyId,
            sender: message.fromUser
              ? { type: 'dev', ...message.fromUser }
              : message.fromCompany
                ? { type: 'company', ...message.fromCompany }
                : null,
          }) satisfies Message,
      );
    return messages.reverse();
  }, [messagesQuery.data?.pages, messagesQuery.isSuccess]);

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) {
      return;
    }
    sendMessageMut.mutate({ text: message, threadId: chatThread.id });
    setMessage('');
  }, [chatThread.id, message, sendMessageMut]);

  useEffect(() => {
    markChatThreadRead(chatThread.id);
  }, [chatThread.id, markChatThreadRead, messages.length]);

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <Chatbox
        messages={messages}
        isLoadingMessage={messagesQuery.isPending}
        currentSenderId={currentUser.id}
        hasMore={messagesQuery.hasNextPage}
        onFetchMore={async () => {
          await messagesQuery.fetchNextPage();
        }}
        isFetchingMore={messagesQuery.isFetchingNextPage}
        header={
          chatThread.company ? (
            <CompanyChatCard company={chatThread.company} />
          ) : chatThread.user ? (
            <DevChatCard user={chatThread.user} />
          ) : null
        }
      />

      <div className="flex w-full flex-shrink-0 border-t p-3">
        <form
          className="bg-secondary relative flex w-full items-center gap-2 rounded-xl p-1 pl-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <RichTextarea
            autoHeight
            className="!placeholder-muted-foreground !bg-secondary !text-foreground max-h-32 resize-none outline-none"
            placeholder="Start a new message"
            rows={1}
            style={{ width: '100%' }}
            autoFocus
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.currentTarget.value)}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.code === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
                return;
              }
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 rounded-xl"
            type="submit"
            disabled={!message.trim() || sendMessageMut.isPending}
          >
            <LuSend />
          </Button>
        </form>
      </div>
    </>
  );
}

function CompanyChatCard({ company }: { company: PublicCompany }) {
  return (
    <div className="relative flex flex-col items-center py-8">
      <Link href={`/c/${company.slug}`} className="inset-0">
        <CompanyAvatar className="h-20 w-20" company={company} />
      </Link>
      <HoverCard>
        <HoverCardTrigger asChild>
          <p className="mt-4 truncate text-center font-bold">
            <Link href={`/c/${company.slug}`} className="inset-0">
              {company.name}
            </Link>
          </p>
        </HoverCardTrigger>
        <HoverCardContent className="pointer-events-auto">
          <HoverCompanyDetailsCard company={company} />
        </HoverCardContent>
      </HoverCard>
      {!!company.shortDescription && <p className="my-3 text-center leading-normal">{company.shortDescription}</p>}
      <p className="text-muted-foreground mt-2 text-center text-sm">
        Joined {format(company.createdAt, 'MMM yyy')} • {formatNumberWithSuffix(company.starsCount, 'star')}
      </p>
    </div>
  );
}

function DevChatCard({ user }: { user: PublicUser }) {
  const profileUrl = `/${user.username ?? user.id}`;

  return (
    <div className="relative flex flex-col items-center py-8">
      <Link href={profileUrl} className="font-semibold hover:underline">
        <Avatar className="h-20 w-20">
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
      </Link>
      <HoverCard>
        <HoverCardTrigger asChild>
          <p className="mt-4 line-clamp-1 font-bold leading-5 hover:underline">
            <Link className="font-semibold hover:underline" href={profileUrl}>
              {getUserDisplayName(user)}
            </Link>
          </p>
        </HoverCardTrigger>
        <HoverCardContent className="pointer-events-auto">
          <HoverProfileDetailsCard profile={user} />
        </HoverCardContent>
      </HoverCard>
      {user.username ? (
        <HoverCard>
          <HoverCardTrigger asChild>
            <p className="text-muted-foreground ml-2 line-clamp-1 text-sm leading-5">
              <Link className="font-semibold hover:underline" href={profileUrl}>
                {getUserDisplayUsername(user)}
              </Link>
            </p>
          </HoverCardTrigger>
          <HoverCardContent className="pointer-events-auto">
            <HoverProfileDetailsCard profile={user} />
          </HoverCardContent>
        </HoverCard>
      ) : null}
      <p className="text-muted-foreground mt-2 text-center text-sm">
        Joined {format(user.createdAt, 'MMM yyy')} • {formatNumberWithSuffix(user.followersCount, 'follower')}
      </p>
      {/* <div className="text-foreground mx-12 mt-4 flex justify-center leading-6">
        {programLanguageBadges.length === 0 ? null : (
          <div className="flex flex-wrap justify-center gap-2">
            {programLanguageBadges.map((badge) => {
              const percent = badge.maxScore > 0 ? Math.floor((badge.score / badge.maxScore) * 70) : 0;
              return (
                <Tooltip key={badge.name}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex h-6 items-center rounded-md border px-3 text-sm font-medium"
                      style={{ background: `rgb(23 166 255 / ${percent}%)` }}
                    >
                      {badge.name}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {badge.connections
                      .sort((a, b) => b.score - a.score)
                      .map((conn) => (
                        <div key={`${conn.provider}-${badge.name}`}>{getBadgeText(conn)}</div>
                      ))}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div> */}
      <LanguageBadgesList user={user} className="mt-4 justify-center" />
    </div>
  );
}
