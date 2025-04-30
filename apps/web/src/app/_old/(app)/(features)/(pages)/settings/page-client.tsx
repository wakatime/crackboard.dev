'use client';

import { getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import type { SettingsMenuListProps } from '@acme/ui/components/settings-menu-list';
import SettingsMenuList from '@acme/ui/components/settings-menu-list';
import TitleBar from '@acme/ui/components/title-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Separator } from '@acme/ui/components/ui/separator';
import { IoPersonOutline } from 'react-icons/io5';
import { LuInfo, LuList, LuLogOut, LuUser, LuUserX } from 'react-icons/lu';

import DrawerToggleButton from '~/components/DrawerToggleButton';
import { useAuth } from '~/providers/AuthProvider';

export default function PageClient() {
  const { currentUser, signOut } = useAuth();

  const list: SettingsMenuListProps['list'] = [
    {
      href: '/settings/account',
      name: 'Account',
      icon: <LuUser />,
    },
    {
      href: '/settings/connections',
      name: 'Connections',
      icon: <LuList />,
    },
    {
      href: '/settings/blocked',
      name: 'Blocked Accounts',
      icon: <LuUserX />,
    },
    {
      href: '/settings/security-events',
      name: 'Security Events',
      icon: <LuList />,
    },
    {
      href: '/settings/about',
      name: 'About',
      icon: <LuInfo />,
    },
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <TitleBar hideBackButton title="Settings" leading={<DrawerToggleButton />} />

      <div className="my-8 flex flex-col items-center justify-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUser.avatarUrl} />
          <AvatarFallback>
            <IoPersonOutline size={20} />
          </AvatarFallback>
        </Avatar>
        <p className="text-2xl font-semibold">{getUserDisplayName(currentUser)}</p>
        <p className="text-muted-foreground">{getUserDisplayUsername(currentUser)}</p>
      </div>
      <Separator />
      <SettingsMenuList list={list} />
      <Separator />
      <SettingsMenuList
        list={[
          {
            icon: <LuLogOut />,
            onClick: () => {
              void signOut();
            },
            variant: 'destructive',
            name: 'Sign Out',
          },
        ]}
      />
      <div className="h-48"></div>
    </>
  );
}
