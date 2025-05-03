'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { format } from 'date-fns';
import { useState } from 'react';
import { LuUser } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function PageClient() {
  return (
    <main className="container mx-auto my-8 max-w-7xl px-4 md:px-8">
      <LeadersTable />
    </main>
  );
}

function LeadersTable() {
  const [date] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const leadersQuery = api.leaderboard.getLeaders.useQuery({ date });

  if (leadersQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (leadersQuery.isError) {
    return <p>{leadersQuery.error.message}</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Position</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Time Today</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead>Editors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadersQuery.data.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground p-4 text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            leadersQuery.data.items.map((leader, i) => (
              <TableRow key={leader.user.id}>
                <TableCell className="pl-4">
                  {i === 0 ? (
                    <p className="text-base leading-5 font-bold text-yellow-500">
                      👑 #1
                      <br />
                      cracked
                    </p>
                  ) : (
                    <p className="text-base font-semibold">#{i + 1}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md min-w-0 items-center gap-2">
                    <Avatar className="size-10">
                      {leader.user.avatarUrl ? <AvatarImage src={leader.user.avatarUrl} /> : null}
                      <AvatarFallback>
                        <LuUser className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex-1 truncate font-semibold">{leader.user.name}</p>
                      <p className="text-muted-foreground flex-1 truncate">@{leader.user.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getMinutesStringFromSeconds(leader.totalSeconds)}</TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-2">
                    {leader.languages.map((language) => (
                      <Button key={language.programLanguageName} size="sm" variant="secondary" className="h-fit px-2 py-1.5 text-xs">
                        {`${language.programLanguageName} - ${getMinutesStringFromSeconds(language.totalSeconds)}`}
                      </Button>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-2">
                    {leader.editors.map((editor) => (
                      <Button key={editor.editorName} size="sm" variant="secondary" className="h-fit px-2 py-1.5 text-xs">
                        {`${editor.editorName} - ${getMinutesStringFromSeconds(editor.totalSeconds)}`}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function getMinutesStringFromSeconds(seconds: number) {
  return `${Math.round(seconds / 60).toLocaleString()}m`;
}
