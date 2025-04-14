'use client';

import { APP_NAME } from '@acme/core/constants';
import { CustomDialog } from '@acme/ui/components/CustomDialog';
import { Button } from '@acme/ui/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import { DialogClose } from '@acme/ui/components/ui/dialog';
import { toast } from '@acme/ui/components/ui/sonner';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { LuLoaderCircle, LuTrash } from 'react-icons/lu';

import { api } from '~/trpc/client';

export default function DeleteAccountCard() {
  const router = useRouter();

  const utils = api.useUtils();
  const deleteAccount = api.auth.deleteAccount.useMutation();

  const onClickDeleteAccount = useCallback(() => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        void utils.invalidate();
        router.push('/');
        router.refresh();
      },
      onError: (error) => {
        toast.error('Failed to delete account', { description: error.message });
      },
    });
  }, [deleteAccount, router, utils]);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently remove your Personal Account and all of its contents from the {APP_NAME} platform. This action is not reversible, so
          please continue with caution.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <CustomDialog
          description="This can’t be reversed."
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button disabled={deleteAccount.isPending || deleteAccount.isSuccess} onClick={onClickDeleteAccount} variant="destructive">
                  {deleteAccount.isPending ? <LuLoaderCircle className="animate-spin" size={20} /> : null}
                  Delete account
                </Button>
              </DialogClose>
            </>
          }
          title="Are you sure?"
          trigger={
            <Button disabled={deleteAccount.isPending || deleteAccount.isSuccess} variant="destructive">
              {deleteAccount.isPending ? <LuLoaderCircle className="animate-spin" /> : <LuTrash />}
              Delete account
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
