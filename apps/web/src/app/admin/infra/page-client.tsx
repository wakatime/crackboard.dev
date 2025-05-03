'use client';

import { Button } from '@workspace/ui/components/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { toast } from 'sonner';

import { api } from '~/trpc/client';

export default function PageClient() {
  const syncProgramLanguagesMut = api.admin.infra.syncProgramLanguages.useMutation({
    onMutate: () => {
      const toastId = toast.loading('Syncing program languages...');
      return {
        toastId,
      };
    },
    onSuccess: (_data, _vars, ctx) => {
      toast.success('Successfully synced program languages.', {
        id: ctx.toastId,
      });
    },
    onError: (error, _vars, ctx) => {
      toast.error('Failed to sync program languages.', {
        description: error.message,
        id: ctx?.toastId,
      });
    },
  });
  const syncEditorsMut = api.admin.infra.syncEditors.useMutation({
    onMutate: () => {
      const toastId = toast.loading('Syncing editors...');
      return {
        toastId,
      };
    },
    onSuccess: (_data, _vars, ctx) => {
      toast.success('Successfully synced editors.', {
        id: ctx.toastId,
      });
    },
    onError: (error, _vars, ctx) => {
      toast.error('Failed to sync editors.', {
        description: error.message,
        id: ctx?.toastId,
      });
    },
  });
  const syncSummariesForAllUsersMut = api.admin.infra.syncSummariesForAllUsers.useMutation({
    onSuccess: () => {
      toast.success('Started Syncing summaries for all users in the background.');
    },
    onError: () => {
      toast.error('Failed to start syncing summaries for all users.');
    },
  });

  return (
    <>
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <p className="text-lg font-bold">Infra</p>
      </header>

      <div className="container mx-auto my-8 max-w-4xl space-y-8 px-4 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Program Languages</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => syncProgramLanguagesMut.mutate()}>Sync Program Languages</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editors</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => syncEditorsMut.mutate()}>Sync Editors</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Summaries</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => syncSummariesForAllUsersMut.mutate()}>Sync Summaries for All Users</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
