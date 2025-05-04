'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuLoaderCircle } from 'react-icons/lu';
import { toast } from 'sonner';

import { useAuth } from '~/providers/auth-providers';
import { api } from '~/trpc/client';

export default function PageClient() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <main className="container mx-auto my-8 max-w-3xl space-y-6 px-4 md:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p>
            To change your name or other info, update your{' '}
            <Link href="https://wakatime.com/settings/profile" target="_blank" className="underline">
              WakaTime profile
            </Link>
            , then re-login here.
          </p>
        </CardContent>
      </Card>
      <DeleteAccount />
    </main>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const utils = api.useUtils();
  const deleteAccountMut = api.auth.deleteAccount.useMutation({
    onMutate: () => {
      const toastId = toast.loading('Deleting account...');
      return { toastId };
    },
    onSuccess: (_data, _vars, ctx) => {
      toast.success('Account deleted successfully', {
        id: ctx.toastId,
      });
      void utils.invalidate();
      router.push('/');
    },
    onError: (error, _vars, ctx) => {
      toast.error('Failed to delete user', {
        description: error.message,
        id: ctx?.toastId,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>Would you like to delete your account and all associated data?</CardDescription>
      </CardHeader>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="cursor-pointer" variant="destructive" disabled={deleteAccountMut.isPending || deleteAccountMut.isSuccess}>
              {deleteAccountMut.isPending ? <LuLoaderCircle className="animate-spin" /> : null}
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your account? This is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn('cursor-pointer', buttonVariants({ variant: 'destructive' }))}
                onClick={() => deleteAccountMut.mutate()}
                disabled={deleteAccountMut.isPending}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
