import type { PublicUser } from '@acme/core/types';
import { getUserDisplayUsername } from '@acme/core/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@acme/ui/components/ui/alert-dialog';
import { Button } from '@acme/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui/components/ui/dropdown-menu';
import { toast } from '@acme/ui/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import { useCallback, useState } from 'react';
import { IoEllipsisHorizontal, IoShareOutline } from 'react-icons/io5';
import { LuUserCheck, LuUserX } from 'react-icons/lu';

import { useBlockUserMutation, useUnBlockUserMutation } from '~/hooks/mutations/user';
import { useAuth } from '~/providers/AuthProvider';

export default function ProfileActionButton({ profile }: { profile: PublicUser }) {
  const [showBlockUserAlertDialog, setShowBlockUserAlertDialog] = useState(false);
  const [showUnBlockUserAlertDialog, setShowUnBlockUserAlertDialog] = useState(false);
  const blockUserMut = useBlockUserMutation();
  const unBlockUserMut = useUnBlockUserMutation();
  const { currentUser } = useAuth();

  const isBusy = blockUserMut.isPending || unBlockUserMut.isPending;

  const handleShareUser = useCallback(() => {
    void window.navigator.clipboard.writeText(profile.url);
    toast.success('Copied to clipboard');
  }, [profile.url]);

  const handleBlockUser = useCallback(() => {
    if (!currentUser || currentUser.id === profile.id || isBusy) {
      return;
    }
    blockUserMut.mutate({ userId: profile.id });
  }, [blockUserMut, currentUser, isBusy, profile.id]);

  const handleUnBlockUser = useCallback(() => {
    if (!currentUser || currentUser.id === profile.id || isBusy) {
      return;
    }
    unBlockUserMut.mutate({ userId: profile.id });
  }, [currentUser, isBusy, profile.id, unBlockUserMut]);

  return (
    <>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button size="icon" variant="secondary" className="h-9 w-9">
                <IoEllipsisHorizontal />
                <div className="sr-only">More</div>
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleShareUser}>
              <IoShareOutline className="mr-2 h-4 w-4" />
              Share {getUserDisplayUsername(profile)}
            </DropdownMenuItem>
            {currentUser && currentUser.id !== profile.id ? (
              <>
                <DropdownMenuSeparator />
                {profile.isBlocked ? (
                  <DropdownMenuItem onClick={() => setShowUnBlockUserAlertDialog(true)}>
                    <LuUserCheck className="mr-2 h-4 w-4" />
                    Unblock {getUserDisplayUsername(profile)}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowBlockUserAlertDialog(true)}>
                    <LuUserX className="mr-2 h-4 w-4" />
                    Block {getUserDisplayUsername(profile)}
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>More</TooltipContent>
      </Tooltip>

      <AlertDialog open={showUnBlockUserAlertDialog} onOpenChange={setShowUnBlockUserAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User?</AlertDialogTitle>
            <AlertDialogDescription>The account will be able to interact with you after unblocking.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleUnBlockUser}>
                Unblock
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBlockUserAlertDialog} onOpenChange={setShowBlockUserAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleBlockUser} variant="destructive">
                Block
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
