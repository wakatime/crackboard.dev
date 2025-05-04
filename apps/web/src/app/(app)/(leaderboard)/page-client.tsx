'use client';

import { getReadableTextColor, today } from '@workspace/core/utils/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import { LuLoaderCircle, LuUser } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function PageClient() {
  return (
    <main className="container mx-auto my-8 max-w-7xl px-4 md:px-8">
      <LeadersTable />
    </main>
  );
}

function LeadersTable() {
  const [date] = useState(() => today());
  const { theme } = useTheme();
  const leadersQuery = api.leaderboard.getLeaders.useQuery({ date });
  const programLanguagesQuery = api.languages.getAllProgramLanguages.useQuery();
  const editorsQuery = api.editors.getAllEditors.useQuery();

  const languages = useMemo(() => {
    return new Map<string, string | null>(programLanguagesQuery.data?.map((lang) => [lang.name, lang.color]) ?? []);
  }, [programLanguagesQuery.data]);

  const editors = useMemo(() => {
    return new Map<string, string | null>(editorsQuery.data?.map((editor) => [editor.name, editor.color]) ?? []);
  }, [editorsQuery.data]);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow noHover={true}>
            <TableHead className="pl-4">Position</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Time Today</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead>Editors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadersQuery.isPending ? (
            <TableRow>
              <TableCell colSpan={5}>
                <div className="flex items-center justify-center px-4 py-16">
                  <LuLoaderCircle className="size-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : leadersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={5}>
                <div className="text-muted-foreground p-4 text-center">{leadersQuery.error.message}</div>
              </TableCell>
            </TableRow>
          ) : leadersQuery.data.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <div className="text-muted-foreground p-4 text-center">No users found.</div>
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
                      {leader.user.avatarUrl ? (
                        <Link href={leader.user.url}>
                          <AvatarImage src={leader.user.avatarUrl} />
                        </Link>
                      ) : null}
                      <AvatarFallback>
                        <LuUser className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex-1 truncate font-semibold">
                        <Link href={leader.user.url}>{leader.user.name}</Link>
                      </p>
                      <p className="text-muted-foreground flex-1 truncate">
                        <Link href={leader.user.url}>@{leader.user.username}</Link>
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-lg">{formatSeconds(leader.totalSeconds)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-2">
                    {leader.languages.map((language, index) => {
                      if (language.totalSeconds < 60 && index > 0) {
                        return null;
                      }
                      const bgColor = languages.get(language.programLanguageName) ?? undefined;
                      const color = getReadableTextColor(bgColor, theme === 'dark' ? 'white' : 'black');
                      return (
                        <Button
                          key={language.programLanguageName}
                          size="sm"
                          variant="secondary"
                          className="h-fit px-2 py-1.5 text-xs"
                          style={{ backgroundColor: bgColor, color }}
                        >
                          {`${language.programLanguageName} - ${formatSeconds(language.totalSeconds)}`}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-2">
                    {leader.editors.map((editor, index) => {
                      if (editor.totalSeconds < 60 && index > 0) {
                        return null;
                      }
                      const bgColor = editors.get(editor.editorName) ?? undefined;
                      const color = getReadableTextColor(bgColor, theme === 'dark' ? 'white' : 'black');
                      return (
                        <Button
                          key={editor.editorName}
                          size="sm"
                          variant="secondary"
                          className="h-fit px-2 py-1.5 text-xs"
                          style={{ backgroundColor: bgColor, color }}
                        >
                          {`${editor.editorName} - ${formatSeconds(editor.totalSeconds)}`}
                        </Button>
                      );
                    })}
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

function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatSeconds(totalSeconds: number) {
  let text = '';

  if (totalSeconds < 60) {
    return '0 m';
  }

  const hours = Math.floor(totalSeconds / 3600.0);
  const minutes = Math.floor(totalSeconds / 60.0) % 60;
  if (hours > 0) {
    text += numberWithCommas(hours) + ' h';
  }
  if (minutes > 0) {
    text += ' ' + minutes + ' m';
  }
  return text.trim();
}
