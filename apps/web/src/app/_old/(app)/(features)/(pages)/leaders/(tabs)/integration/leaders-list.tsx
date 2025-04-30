'use client';

import { getUserDisplayName } from '@acme/core/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Card } from '@acme/ui/components/ui/card';
import { Skeleton } from '@acme/ui/components/ui/skeleton';
import Link from 'next/link';
import { LuUser } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function IntegrationLeadersList() {
  const query = api.leaders.getIntegrationsWithLeaders.useQuery();

  if (query.isPending) {
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="text-muted-foreground p-4">
        <p>{query.error.message}</p>
      </div>
    );
  }

  if (query.data.length < 1) {
    return (
      <div className="text-muted-foreground p-4">
        <p>No leaders found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {query.data
        .filter((i) => i.users.length > 0 && !!i.integration.icon)
        .map((i) => {
          return (
            <Card className="hover:bg-muted" key={i.integration.name}>
              <Link href={`/leaders/integration/${i.id}`}>
                <div className="items-top flex gap-0 p-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="fill-foreground h-10 w-10" dangerouslySetInnerHTML={{ __html: i.integration.icon ?? '' }} />
                    <div className="bg-border h-16 w-px" />
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <h3 className="mb-2 mt-2 truncate pl-3 font-semibold leading-6">{i.integration.name}</h3>
                    <ul className="list-outside list-disc pl-5 align-middle">
                      {i.users.map((user, index) => {
                        const opacity = index === 0 ? 'opacity-80' : index === 1 ? 'opacity-50' : 'opacity-20';
                        return (
                          <li className={`relative mb-1 ${opacity}`} key={`${i.integration.name}${user.user.id}`}>
                            <div className="relative top-1 flex flex-1 gap-2 overflow-hidden">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.user.avatarUrl} />
                                <AvatarFallback>
                                  <LuUser size={12} />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-semibold leading-5">
                                  {getUserDisplayName(user.user)}
                                  <span className="ml-1.5 text-xs font-light">{user.badgeText}</span>
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
    </div>
  );
}
