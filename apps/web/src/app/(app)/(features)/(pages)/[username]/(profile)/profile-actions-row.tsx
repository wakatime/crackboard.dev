import type { PublicUser } from '@acme/core/types';
import { Button } from '@acme/ui/components/ui/button';
import { toast } from '@acme/ui/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import { cn } from '@acme/ui/lib/utils';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';
import { LuCheck, LuPlus } from 'react-icons/lu';

import UserFollowUnfollowButton from '~/components/UserFollowUnfollowButton';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

import ProfileActionButton from './profile-action-button';

export interface ProfileActionsRowProps {
  className?: string;
  user: PublicUser;
}
export default function ProfileActionsRow({ user, className }: ProfileActionsRowProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const utils = api.useUtils();

  const createOrGetThreadMut = api.chat.createOrGetThread.useMutation({
    onSuccess: (thread) => {
      if (thread.created) {
        void utils.chat.getChatThreads.invalidate();
      }
      router.push(`/chats/${thread.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create thread', { description: error.message });
    },
  });

  const handleStartConversation = useCallback(() => {
    createOrGetThreadMut.mutate({ userId: user.id });
  }, [createOrGetThreadMut, user.id]);

  return (
    <div className={cn('flex flex-1 flex-wrap items-center justify-end gap-2', className)}>
      {!!currentUser && currentUser.id !== user.id && user.doesFollowMe ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={handleStartConversation}
              disabled={createOrGetThreadMut.isPending}
            >
              <IoChatboxEllipsesOutline />
              <div className="sr-only">Message</div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Message</TooltipContent>
        </Tooltip>
      ) : null}
      <UserFollowUnfollowButton user={user} unfollowLabel="Following" followIcon={<LuPlus />} unfollowIcon={<LuCheck />} />
      <ProfileActionButton profile={user} />
    </div>
  );
}
