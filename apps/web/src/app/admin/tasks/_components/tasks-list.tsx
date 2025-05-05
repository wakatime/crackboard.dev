'use client';

import { formatNumberWithSuffix } from '@workspace/core/utils/helpers';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Switch } from '@workspace/ui/components/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import Link from 'next/link';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

import { api } from '~/trpc/client';

export default function TasksList() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounceValue<string>(q, 300)[0];
  const tasksQuery = api.admin.infra.searchTasks.useQuery({ q: debouncedQ });
  const { data: isDisabled, refetch } = api.admin.infra.getTasksEnabledStatus.useQuery();
  const disableTasks = api.admin.infra.setTasksEnabledStatus.useMutation();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
  };

  const onClickDisable = async (isDisabled: boolean) => {
    await disableTasks.mutateAsync({ isDisabled });
    await refetch();
  };

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div>
        <Switch
          autoCorrect="off"
          checked={isDisabled}
          className="mr-2"
          id="toggle-background-tasks"
          onCheckedChange={(val) => void onClickDisable(val)}
        />
        <Label className="text-muted-foreground relative -top-1 text-sm" htmlFor="toggle-background-tasks">
          Disable all background tasks
        </Label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input className="max-w-sm flex-1" id="search" onChange={onChange} placeholder="Search tasks…" />
        {tasksQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(tasksQuery.data.total, 'task')}</p>
        ) : (
          <Skeleton className="h-6 w-32" />
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksQuery.isPending ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3, 4].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : tasksQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{tasksQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : tasksQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No tasks found</p>
                </TableCell>
              </TableRow>
            ) : (
              tasksQuery.data.tasks.map((task) => {
                return (
                  <TableRow key={task.name}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/admin/tasks/${task.name}`}>{`${task.name}(${task.args.join(
                        ', ',
                      )})`}</Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
