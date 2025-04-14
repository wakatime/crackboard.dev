import type { TRPCError } from '@acme/api';
import type { PublicConnection } from '@acme/core/types';
import { relativeDate } from '@acme/core/utils';
import type { IntegrationIdentifier } from '@acme/db/schema';
import { CustomDialog } from '@acme/ui/components/CustomDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Button } from '@acme/ui/components/ui/button';
import { DialogClose } from '@acme/ui/components/ui/dialog';
import { useToast } from '@acme/ui/components/ui/use-toast';
import Link from 'next/link';
import { useCallback } from 'react';
import { LuLoaderCircle, LuUser } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function AccountsList({ connections, provider }: { connections: PublicConnection[]; provider: IntegrationIdentifier }) {
  const disconnectIntegrationMut = api.integrations.disconnectIntegration.useMutation();
  const { toast } = useToast();
  const utils = api.useUtils();

  const handleDisconnectIntegration = useCallback(
    async (connectionId: string) => {
      try {
        await disconnectIntegrationMut.mutateAsync({ connectionId, provider });
        void utils.integrations.integrationSettingsForCurrentUser.invalidate({ provider });
      } catch (error: unknown) {
        toast({ description: (error as TRPCError).message, title: 'Failed to disconnect!', variant: 'destructive' });
      }
    },
    [disconnectIntegrationMut, provider, toast, utils.integrations.integrationSettingsForCurrentUser],
  );

  return (
    <div>
      {connections.map((connection) => {
        const isLoading = disconnectIntegrationMut.isPending && disconnectIntegrationMut.variables.connectionId === connection.id;
        return (
          <div className="flex flex-1 items-center gap-4 p-4" key={connection.url}>
            <Avatar>
              <AvatarImage src={connection.avatar} />
              <AvatarFallback>
                <LuUser size={16} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="line-clamp-1 text-sm leading-5 font-semibold">{connection.name}</p>
              <p className="text-muted-foreground line-clamp-1 text-sm leading-5">
                <Link className="text-primary font-medium hover:underline" href={connection.url} rel="nofollow noopener" target="_blank">
                  @{connection.providerAccountUsername}
                </Link>
                {' • '}connected {relativeDate(connection.createdAt)}
              </p>
            </div>
            <CustomDialog
              description="Are you sure you want to disconnect this account?"
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={() => handleDisconnectIntegration(connection.id)} variant="destructive">
                      Disconnect
                    </Button>
                  </DialogClose>
                </>
              }
              title="Disconnect Account?"
              trigger={
                <Button
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive pointer-events-auto"
                  disabled={disconnectIntegrationMut.isPending}
                  variant="outline"
                >
                  {isLoading ? <LuLoaderCircle className="animate-spin" /> : null}
                  Disconnect
                </Button>
              }
            />
          </div>
        );
      })}
    </div>
  );
}
