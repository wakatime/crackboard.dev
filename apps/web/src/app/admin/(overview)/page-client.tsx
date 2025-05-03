'use client';

import { Button } from '@workspace/ui/components/button';
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
    <div>
      <Button onClick={() => syncProgramLanguagesMut.mutate()}>Sync Languages</Button>
      <Button onClick={() => syncEditorsMut.mutate()}>Sync Editors</Button>
      <Button onClick={() => syncSummariesForAllUsersMut.mutate()}>Sync Summaries for All Users</Button>
    </div>
  );
}
