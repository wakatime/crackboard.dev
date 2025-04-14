'use client';

import TitleBar from '@acme/ui/components/title-bar';
import { Button } from '@acme/ui/components/ui/button';
import { useParams } from 'next/navigation';
import { IoAdd } from 'react-icons/io5';

import CreateNewListDialog from '~/components/dialogs/CreateNewListDialog';
import { useAuth } from '~/providers/AuthProvider';

import ListsList from './_components/lists-list';

export default function PageClient() {
  const { username } = useParams<{ username: string }>();
  const { currentUser } = useAuth();

  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <div>
            <p className="line-clamp-1 text-lg font-bold leading-6">Lists</p>
            <p className="text-muted-foreground line-clamp-1 text-sm leading-4">@{username}</p>
          </div>
        }
        trailing={
          currentUser && currentUser.username === username ? (
            <CreateNewListDialog>
              <Button variant="outline">
                <IoAdd />
                New List
              </Button>
            </CreateNewListDialog>
          ) : null
        }
      />
      <ListsList username={username} />
    </main>
  );
}
