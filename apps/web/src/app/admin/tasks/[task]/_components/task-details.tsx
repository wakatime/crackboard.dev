'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { cn } from '@workspace/ui/lib/utils';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useState } from 'react';
import { LuArrowRight, LuLoaderCircle } from 'react-icons/lu';
import { toast } from 'sonner';

import { api } from '~/trpc/client';

export default function TaskDetails({ task }: { task: string }) {
  const taskQuery = api.admin.tasks.getTask.useQuery(task);
  const execTask = api.admin.tasks.executeBackgroundTask.useMutation();
  const [error, setError] = useState(undefined as string | undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [args, setArgs] = useState(undefined as string | undefined);
  const [inForeground, setInForeground] = useState(false);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const a = e.target.value;
      setArgs(a);
      try {
        const data = JSON.parse(`[${a}]`) as string[];
        if (data.length === taskQuery.data?.args.length) {
          setError(undefined);
        } else {
          setError('Invalid number of args');
        }
      } catch (ex) {
        setError(String(ex));
      }
    },
    [taskQuery.data?.args.length],
  );

  const onToggle = (choice: boolean) => {
    setInForeground(choice);
  };

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(undefined);

      if (!taskQuery.data?.name) {
        setError('Task not found');
        return;
      }

      setIsLoading(true);

      try {
        const data = JSON.parse(`[${args ?? ''}]`) as string[];
        await execTask.mutateAsync({ args: data, inForeground, task: taskQuery.data.name });
        toast(`${taskQuery.data.name} task is running in the background`);
      } catch (ex) {
        setError(String(ex));
      } finally {
        setIsLoading(false);
      }
    },
    [taskQuery.data?.name, args, execTask, inForeground],
  );

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {taskQuery.isPending ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : taskQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{taskQuery.error.message}</p>
        </div>
      ) : !taskQuery.data ? (
        <div className="text-muted-foreground">
          <p>Task not found!</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-lg font-semibold">
              {taskQuery.data.name}({taskQuery.data.args.join(', ')})
            </div>
          </div>

          <hr className="bg-border h-px" />

          <form className="space-y-4" onSubmit={onSubmit}>
            <fieldset className="space-y-1">
              <Switch autoCorrect="off" checked={inForeground} className="mr-2" id="toggle" onCheckedChange={(val) => void onToggle(val)} />
              <Label className="text-muted-foreground relative -top-1 text-sm" htmlFor="toggle">
                Run syncronously without workers
              </Label>
            </fieldset>
            <fieldset className="space-y-1">
              <Label htmlFor="args">Args</Label>
              <Input
                className={cn('border-2', {
                  'border-green-800': !error,
                  'border-red-800': !!error,
                })}
                id="args"
                onChange={onChange}
              />
            </fieldset>

            <Button disabled={isLoading} type="submit">
              {isLoading ? <LuLoaderCircle /> : null}
              Run Task
              {!isLoading ? <LuArrowRight /> : null}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
