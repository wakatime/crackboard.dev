'use client';

import type { PublicUser } from '@acme/core/types';
import { formatNumber, getUserDisplayName, getUserDisplayUsername, hostnameFromUrl } from '@acme/core/utils';
import { CustomDialog } from '@acme/ui/components/CustomDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Button } from '@acme/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import pluralize from 'pluralize';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit } from 'react-icons/fi';
import { LuLink, LuUser } from 'react-icons/lu';

import IntegrationsList from '~/components/IntegrationsList';
import LanguageBadgesList from '~/components/LanguageBadgesList';
import AvatarPickerDialogContent from '~/components/profile/AvatarPickerDialogContent';
import BioPickerDialogContent from '~/components/profile/BioPickerDialogContent';
import NamePickerDialogContent from '~/components/profile/NamePickerDialogContent';
import UsernamePickerDialogContent from '~/components/profile/UsernamePickerDialogContent';
import WebsiteUrlPickerDialogContent from '~/components/profile/WebsiteUrlPickerDialogContent';
import UserFollowUnfollowButton from '~/components/UserFollowUnfollowButton';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

import ProfileActionsRow from './profile-actions-row';

export default function ProfileDetails({ user }: { user: PublicUser }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [showUsernamePicker, setShowUsernamePicker] = useState(false);
  const [showBioPicker, setShowBioPicker] = useState(false);
  const [showWebsiteUrlPicker, setShowWebsiteUrlPicker] = useState(false);
  const { currentUser } = useAuth();
  const setProfileDefaultMut = api.users.setProfileDefault.useMutation();
  const setBioMut = api.users.setBio.useMutation();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const router = useRouter();

  const isMyProfile = useMemo(() => currentUser && currentUser.id === user.id, [currentUser, user.id]);

  const showFollowDialog = useMemo(() => !isMyProfile && searchParams.get('follow') === 'true', [isMyProfile, searchParams]);

  const changeAvatar = () => {
    setShowAvatarPicker(true);
  };

  const changeWebstieUrl = () => {
    setShowWebsiteUrlPicker(true);
  };

  const onSelectAvatar = async (integrationId: string) => {
    setShowAvatarPicker(false);
    await setProfileDefaultMut.mutateAsync({ defaultType: 'avatar', integrationId });
    void utils.users.publicProfileInfo.invalidate(user.id);
    if (user.username) {
      void utils.users.publicProfileInfo.invalidate(user.username);
    }
    void utils.users.getPublicProfileIntegrationsForUser.invalidate({ userId: user.id });
  };
  const onSelectName = async (integrationId: string) => {
    setShowNamePicker(false);
    await setProfileDefaultMut.mutateAsync({ defaultType: 'name', integrationId });
    void utils.users.publicProfileInfo.invalidate(user.id);
    if (user.username) {
      void utils.users.publicProfileInfo.invalidate(user.username);
    }
    void utils.users.getPublicProfileIntegrationsForUser.invalidate({ userId: user.id });
  };
  const onSelectUsername = async (integrationId: string) => {
    setShowUsernamePicker(false);
    const username = await setProfileDefaultMut.mutateAsync({ defaultType: 'username', integrationId });
    router.push(`/${username ?? currentUser?.id}`);
    void utils.users.getPublicProfileIntegrationsForUser.invalidate({ userId: user.id });
  };
  const onSelectWebsiteUrl = async (integrationId: string) => {
    setShowWebsiteUrlPicker(false);
    await setProfileDefaultMut.mutateAsync({ defaultType: 'websiteUrl', integrationId });
    void utils.users.publicProfileInfo.invalidate(user.id);
    if (user.username) {
      void utils.users.publicProfileInfo.invalidate(user.username);
    }
    void utils.users.getPublicProfileIntegrationsForUser.invalidate({ userId: user.id });
  };

  const changeBio = () => {
    setShowBioPicker(true);
  };

  const changeName = () => {
    setShowNamePicker(true);
  };

  const changeUsername = () => {
    setShowUsernamePicker(true);
  };

  const onSelectBio = async (bioId: string) => {
    setShowBioPicker(false);
    await setBioMut.mutateAsync({ bioId });
    void utils.users.publicProfileInfo.invalidate(user.id);
    if (user.username) {
      void utils.users.publicProfileInfo.invalidate(user.username);
    }
  };

  const handleCloseFollowDialog = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('follow');
    router.replace(`/${user.username ?? user.id}?${newParams.toString()}`);
  }, [router, searchParams, user.id, user.username]);

  useEffect(() => {
    if (showFollowDialog && user.isFollowing) {
      handleCloseFollowDialog();
    }
  }, [handleCloseFollowDialog, showFollowDialog, user.isFollowing]);

  return (
    <div className="grid gap-4 border-b p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-fit w-fit flex-shrink-0">
          <Avatar className="h-28 w-28">
            <AvatarImage
              src={user.avatarUrl}
              style={{
                filter: user.isBlocked ? 'blur(10px)' : undefined,
              }}
            />
            <AvatarFallback>
              <LuUser size={48} />
            </AvatarFallback>
          </Avatar>

          {isMyProfile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="absolute bottom-1 right-1 h-8 w-8 rounded-full" onClick={changeAvatar} size="icon" variant="outline">
                  <FiEdit size={18} />
                  <p className="sr-only">Change avatar</p>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change avatar</TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <ProfileActionsRow user={user} />
      </div>

      <div className="grid gap-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="flex-shrink truncate text-2xl font-bold">{getUserDisplayName(user)}</h3>
          {isMyProfile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="h-4 w-4 [&_svg]:size-4" onClick={changeName} size="icon" variant="outline">
                  <FiEdit />
                  <p className="sr-only">Change name</p>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change name</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="flex flex-shrink items-center gap-2 overflow-hidden">
          <p className="text-muted-foreground inline truncate">{getUserDisplayUsername(user)}</p>
          {isMyProfile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="h-4 w-4 [&_svg]:size-4" onClick={changeUsername} size="icon" variant="outline">
                  <FiEdit />
                  <p className="sr-only">Change username</p>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change username</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {user.isBlocked ? null : (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="underline-offset-2 hover:underline" href={`/${user.username ?? user.id}/followers`}>
              <span className="font-semibold">{formatNumber(user.followersCount)}</span>
              <span className="text-muted-foreground"> {pluralize('Follower', user.followersCount)}</span>
            </Link>
            <Link className="underline-offset-2 hover:underline" href={`/${user.username ?? user.id}/following`}>
              <span className="font-semibold">{formatNumber(user.followingCount)}</span>
              <span className="text-muted-foreground"> Following</span>
            </Link>
            <Link className="underline-offset-2 hover:underline" href={`/${user.username ?? user.id}/stars`}>
              <span className="font-semibold">{formatNumber(user.starsCount)}</span>
              <span className="text-muted-foreground"> {pluralize('Star', user.starsCount)}</span>
            </Link>
          </div>

          {user.websiteUrl ? (
            <div className="flex items-center gap-2">
              <Link
                className="text-foreground font-medium underline-offset-2 hover:underline"
                href={user.websiteUrl}
                rel="nofollow noopener me"
                target="_blank"
              >
                <LuLink className="mr-1 inline h-4 w-4" />
                {hostnameFromUrl(user.websiteUrl)}
              </Link>
              {isMyProfile ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-4 w-4 [&_svg]:size-4" onClick={changeWebstieUrl} size="icon" variant="outline">
                      <FiEdit />
                      <p className="sr-only">Change webstie url</p>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Change webstie url</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          ) : isMyProfile ? (
            <button className="font-medium underline-offset-2 hover:underline" onClick={changeWebstieUrl} type="button">
              <FiEdit className="inline h-4 w-4" />
              Select website
            </button>
          ) : null}

          <LanguageBadgesList user={user} />

          <div>
            <p className="inline leading-6">{user.bio ?? 'AI-generated bio displayed after 3+ social profiles connected'}</p>
            {isMyProfile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="ml-2 inline-flex h-4 w-4 [&_svg]:size-4" onClick={changeBio} size="icon" variant="outline">
                    <FiEdit />
                    <p className="sr-only">Change bio</p>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Change bio</TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          <IntegrationsList userId={user.id} />
        </>
      )}

      <CustomDialog onOpenChange={setShowAvatarPicker} open={showAvatarPicker} title="Select your Avatar">
        <AvatarPickerDialogContent onSelect={onSelectAvatar} userId={user.id} />
      </CustomDialog>
      <CustomDialog onOpenChange={setShowBioPicker} open={showBioPicker} title="Select your AI-generated bio">
        <BioPickerDialogContent onClose={() => setShowBioPicker(false)} onSelect={(bioId) => onSelectBio(bioId)} profile={user} />
      </CustomDialog>
      <CustomDialog onOpenChange={setShowNamePicker} open={showNamePicker} title="Select your name">
        <NamePickerDialogContent onSelect={onSelectName} userId={user.id} />
      </CustomDialog>
      <CustomDialog onOpenChange={setShowUsernamePicker} open={showUsernamePicker} title="Select your username">
        <UsernamePickerDialogContent onSelect={onSelectUsername} userId={user.id} />
      </CustomDialog>
      <CustomDialog onOpenChange={setShowWebsiteUrlPicker} open={showWebsiteUrlPicker} title="Select website url">
        <WebsiteUrlPickerDialogContent onSelect={onSelectWebsiteUrl} userId={user.id} />
      </CustomDialog>

      <CustomDialog
        footer={<UserFollowUnfollowButton user={user} onClick={handleCloseFollowDialog} />}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseFollowDialog();
          }
        }}
        open={showFollowDialog && !user.isFollowing}
        title={`Follow ${getUserDisplayName(user)}`}
      />
    </div>
  );
}
