'use client';

import type { PublicUser } from '@acme/core/types';
import { getUserDisplayName } from '@acme/core/utils';
import { CustomDialog } from '@acme/ui/components/CustomDialog';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import UserBlockUnblockButton from '~/components/UserBlockUnblockButton';
import UserFollowUnfollowButton from '~/components/UserFollowUnfollowButton';
import { useAuth } from '~/providers/AuthProvider';

export default function ProfileFollowButton({ user }: { user: PublicUser }) {
  const { currentUser } = useAuth();
  const isMyProfile = useMemo(() => !!currentUser && currentUser.id === user.id, [currentUser, user.id]);

  const [showFollowConfirmDialog, setShowFollowConfirmDialog] = useState(false);
  const [followDialogOpenedOnce, setFollowDialogOpenedOnce] = useState(false);
  const searchParams = useSearchParams();

  const shouldFollow = useMemo(() => !isMyProfile && searchParams.get('follow') === 'true', [isMyProfile, searchParams]);

  useEffect(() => {
    if (followDialogOpenedOnce) {
      return;
    }

    if (currentUser && shouldFollow && !user.isFollowing) {
      setShowFollowConfirmDialog(true);
      setFollowDialogOpenedOnce(true);
    }
  }, [currentUser, followDialogOpenedOnce, shouldFollow, user.isFollowing]);

  if (isMyProfile) {
    return null;
  }

  if (user.isBlocked) {
    return <UserBlockUnblockButton user={user} />;
  }

  return (
    <>
      <UserFollowUnfollowButton user={user} />

      <CustomDialog
        footer={<UserFollowUnfollowButton user={user} onClick={() => setShowFollowConfirmDialog(false)} />}
        onOpenChange={setShowFollowConfirmDialog}
        open={showFollowConfirmDialog}
        title={`Follow ${getUserDisplayName(user)}`}
      />
    </>
  );
}
