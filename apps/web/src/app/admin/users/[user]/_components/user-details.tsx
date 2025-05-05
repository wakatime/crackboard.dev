'use client';

import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuExternalLink } from 'react-icons/lu';

import type { RouterOutputs } from '~/trpc/client';
import { api } from '~/trpc/client';

export default function UserDetails({ user }: { user: NonNullable<RouterOutputs['admin']['users']['getUser']> }) {
  const router = useRouter();
  const deleteUser = api.admin.users.deleteUser.useMutation({
    onSuccess: () => {
      void router.push('/admin/users');
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-lg font-semibold">
            {user.username ? (
              <Link className="hover:underline" href={`/${user.username}`} rel="nofollow noopener" target="_blank">
                User {user.username}
                <LuExternalLink className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            ) : (
              `User ${user.id}`
            )}
          </div>
          <p className="text-muted-foreground text-sm">Created {user.createdAt.toISOString()}</p>
        </div>
        <Button onClick={() => deleteUser.mutate(user.id)} variant="destructive" className="cursor-pointer">
          Delete
        </Button>
      </div>
    </>
  );
}
