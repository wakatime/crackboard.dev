'use client';

import { useParams } from 'next/navigation';
import { LuLoaderCircle } from 'react-icons/lu';

import { api } from '~/trpc/client';

import UserDetails from './_components/user-details';

export default function PageClient() {
  const { user } = useParams<{ user: string }>();
  const userQuery = api.admin.users.getUser.useQuery(user);

  if (userQuery.isPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <div className="text-muted-foreground">
        <p>{userQuery.error.message}</p>
      </div>
    );
  }

  if (!userQuery.data) {
    return (
      <div className="text-muted-foreground">
        <p>User not found!</p>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <UserDetails user={userQuery.data} />
    </div>
  );
}
