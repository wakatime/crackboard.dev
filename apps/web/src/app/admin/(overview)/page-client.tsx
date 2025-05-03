'use client';

import { Button } from '@workspace/ui/components/button';
import { toast } from 'sonner';

import { api } from '~/trpc/client';

export default function PageClient() {
  const syncSummariesForAllUsersMut = api.admin.infra.syncSummariesForAllUsers.useMutation({
    onSuccess: () => {
      toast.success('Started Syncing summaries for all users');
    },
    onError: () => {
      toast.error('Failed to sync summaries for all users.');
    },
  });

  return (
    <div>
      <Button onClick={() => syncSummariesForAllUsersMut.mutate()}>Sync Summaries for All Users</Button>
    </div>
  );
}
