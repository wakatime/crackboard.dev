'use client';

import { getUserDisplayName, getUserDisplayUsername } from '@acme/core/utils';
import TimelineSideBarItem from '@acme/ui/components/timeline-sidebar-item';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Button } from '@acme/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui/components/ui/dropdown-menu';
import { Skeleton } from '@acme/ui/components/ui/skeleton';
import { cn } from '@acme/ui/lib/utils';
import type { SidebarItem } from '@acme/ui/types/sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { IoHomeOutline, IoHomeSharp, IoPersonOutline, IoSettingsOutline, IoSettingsSharp } from 'react-icons/io5';
import { LuEllipsis, LuLogOut } from 'react-icons/lu';
import { PiBuildingsFill, PiBuildingsLight } from 'react-icons/pi';

import ThemeToggleDropdownItem from '~/components/ThemeToggleDropdownItem';
import { useAuth } from '~/providers/AuthProvider';

export default function AppSidebar({ collapsed, className }: { className?: string; collapsed?: boolean }) {
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const sidebarItems = useMemo(
    () => [
      {
        activeIcon: <IoHomeSharp />,
        href: '/',
        exact: true,
        icon: <IoHomeOutline />,
        name: 'Daily',
      },
      {
        activeIcon: <PiBuildingsFill />,
        href: '/weekly',
        icon: <PiBuildingsLight />,
        name: 'Weekly',
      },
      ...(currentUser
        ? ([
            {
              activeIcon: <IoSettingsSharp />,
              href: '/settings',
              icon: <IoSettingsOutline />,
              name: 'Settings',
            },
          ] satisfies SidebarItem[])
        : []),
    ],
    [currentUser],
  );

  return (
    <>
      <div
        className={cn(
          'flex items-center p-4 pb-0',
          {
            'flex w-full items-center justify-center px-0': collapsed,
          },
          className,
        )}
      >
        <Link
          href={currentUser ? '/' : '/timeline'}
          className={cn({
            'px-3': !collapsed,
          })}
        >
          <Image alt="wonderful.dev" height={48} src="/logo.svg" width={48} className="h-12 w-12" />
        </Link>
      </div>

      <div
        className={cn('flex flex-1 flex-col p-4', {
          'items-center px-0': collapsed,
        })}
      >
        {isAuthLoading
          ? new Array(7).fill(1).map((_, i) => <Skeleton className={cn(collapsed ? 'my-0.5 h-14 w-14' : 'my-0.5 h-12')} key={i} />)
          : sidebarItems.map((item) => {
              return <TimelineSideBarItem key={item.name} item={item} collapsed={collapsed} />;
            })}
      </div>

      <div
        className={cn('flex flex-col items-stretch p-4 pt-0', {
          'items-center justify-center px-0': collapsed,
        })}
      >
        <UserButton collapsed={collapsed} />
      </div>
    </>
  );
}

function UserButton({ collapsed }: { collapsed?: boolean }) {
  const { currentUser, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <Skeleton className="h-14 rounded-full" />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn('flex h-fit items-center justify-start gap-2 rounded-full p-2 text-left', {
            'items-center justify-center': collapsed,
          })}
          variant="ghost"
        >
          <Avatar>
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>
              <IoPersonOutline size={20} />
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col justify-center gap-1 overflow-hidden">
                <p className="truncate text-lg font-semibold leading-none">{getUserDisplayName(currentUser)}</p>
                <p className="text-muted-foreground truncate leading-none">{getUserDisplayUsername(currentUser)}</p>
              </div>
              <LuEllipsis className="mr-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={`/${currentUser.username ?? currentUser.id}`}>
            <IoPersonOutline className="mr-2" size={22} /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggleDropdownItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={'/settings'}>
            <IoSettingsOutline className="mr-2" size={22} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LuLogOut className="mr-2" size={22} />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
