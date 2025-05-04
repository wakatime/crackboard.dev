'use client';

import { APP_DOMAIN } from '@workspace/core/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { MoonIcon, SunIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

import ThemeToggleDropdownItem from '~/components/theme-toggle-dropdown-item';
import { useAuth } from '~/providers/auth-providers';

export default function NavBar() {
  const { currentUser } = useAuth();

  return (
    <header className="bg-background sticky top-0 z-30">
      <div className="container mx-auto flex h-28 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link href="/">
          <Image alt={APP_DOMAIN} height={120} src="/logo.svg" width={120} className="inline object-contain" />
        </Link>
        <div className="flex-1 text-center">
          <Link className="mr-12 text-xl font-semibold" href="/">
            {APP_DOMAIN}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <UserButton />
          ) : (
            <>
              <ThemeToggleButton />
              <Button asChild>
                <Link href="/flow/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function UserButton() {
  const { currentUser, signOut } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Avatar className="size-10">
          {currentUser.avatarUrl ? <AvatarImage src={currentUser.avatarUrl} /> : null}
          <AvatarFallback>
            <UserIcon className="size-5" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/settings/account`}>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggleDropdownItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  return (
    <Button onClick={toggleTheme} size="icon" variant="outline">
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
    </Button>
  );
}
