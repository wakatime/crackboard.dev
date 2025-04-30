'use client';

import FloatingButton from '@acme/ui/components/FloatingButton';
import TitleBar from '@acme/ui/components/title-bar';
import { Button } from '@acme/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuMessageSquarePlus } from 'react-icons/lu';

import DrawerToggleButton from '~/components/DrawerToggleButton';

import ChatsList from './_components/chats-list';

export default function PageClient() {
  const router = useRouter();

  return (
    <>
      <TitleBar
        title="Chats"
        leading={<DrawerToggleButton />}
        hideBackButton
        trailing={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" asChild>
                <Link href="/chats/new">
                  <LuMessageSquarePlus />
                  <div className="sr-only">New Message</div>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Message</TooltipContent>
          </Tooltip>
        }
      />
      <ChatsList />
      <div className="h-48"></div>
      <FloatingButton onClick={() => router.push(`/chats/new`)}>
        <LuMessageSquarePlus />
      </FloatingButton>
    </>
  );
}
