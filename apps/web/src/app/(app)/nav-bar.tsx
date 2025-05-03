'use client';

import { APP_DOMAIN } from '@workspace/core/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import Link from 'next/link';
import React from 'react';
import { LuUser } from 'react-icons/lu';

import { useAuth } from '~/providers/auth-providers';

export default function NavBar() {
  const { currentUser } = useAuth();

  return (
    <header className="bg-background sticky top-0 z-30">
      <div className="container mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-8">
        <Link className="text-xl font-semibold" href="/">
          {APP_DOMAIN}
        </Link>
        <div className="flex-1"></div>

        {currentUser ? (
          <UserButton />
        ) : (
          <Button asChild>
            <Link href="/flow/login">Sign In</Link>
          </Button>
        )}
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
      <DropdownMenuTrigger asChild>
        <Avatar className="size-10">
          {currentUser.avatarUrl ? <AvatarImage src={currentUser.avatarUrl} /> : null}
          <AvatarFallback>
            <LuUser className="size-5" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
