'use client';

import TabBar from '@acme/ui/components/tab-bar';
import type { SidebarItem } from '@acme/ui/types/sidebar';
import { useMemo } from 'react';
import {
  IoChatboxEllipses,
  IoChatboxEllipsesOutline,
  IoHomeOutline,
  IoHomeSharp,
  IoNotifications,
  IoNotificationsOutline,
} from 'react-icons/io5';
import { PiBuildingsFill, PiBuildingsLight, PiSuitcase, PiSuitcaseFill } from 'react-icons/pi';

import { useAuth } from '~/providers/AuthProvider';
import { useBadges } from '~/providers/BadgesProvider';

export default function AppTabBar() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { unreadNotificationCount, unreadThreadsCount } = useBadges();

  const items = useMemo(
    (): SidebarItem[] => [
      {
        activeIcon: <IoHomeSharp />,
        href: currentUser ? '/' : '/timeline',
        exact: true,
        icon: <IoHomeOutline />,
        name: 'Home',
        includePaths: [{ href: '/timeline' }],
      },
      {
        activeIcon: <PiBuildingsFill />,
        href: '/companies',
        icon: <PiBuildingsLight />,
        name: 'Companies',
      },
      {
        activeIcon: <PiSuitcaseFill />,
        href: '/jobs',
        icon: <PiSuitcase />,
        name: 'Jobs',
      },
      /*{
        activeIcon: <IoPeople />,
        href: '/leaders',
        icon: <IoPeopleOutline />,
        name: 'Leaders',
      },*/
      ...(currentUser
        ? ([
            /*{
              activeIcon: <IoList />,
              href: `/${currentUser.username}/lists`,
              icon: <IoListOutline />,
              name: 'Lists',
            },*/
            {
              activeIcon: <IoChatboxEllipses />,
              href: '/chats',
              icon: <IoChatboxEllipsesOutline />,
              name: 'Chats',
              notificationBadge: unreadThreadsCount,
            },
            {
              activeIcon: <IoNotifications />,
              href: '/notifications',
              icon: <IoNotificationsOutline />,
              name: 'Notifications',
              notificationBadge: unreadNotificationCount,
            },
            // {
            //   activeIcon: <IoPerson />,
            //   excludePaths: [{ href: `/${currentUser.username ?? currentUser.id}/lists` }],
            //   href: `/${currentUser.username ?? currentUser.id}`,
            //   icon: <IoPersonOutline />,
            //   name: 'Profile',
            // },
            // {
            //   activeIcon: <IoSettingsSharp />,
            //   href: '/settings',
            //   icon: <IoSettingsOutline />,
            //   name: 'Settings',
            // },
          ] satisfies SidebarItem[])
        : []),
    ],
    [currentUser, unreadNotificationCount, unreadThreadsCount],
  );

  if (isAuthLoading) {
    return <div className="bg-card fixed bottom-0 left-0 right-0 z-30 flex h-16 border-t"></div>;
  }

  return <TabBar menu={items} className="fixed bottom-0 left-0 right-0 z-30" />;
}
