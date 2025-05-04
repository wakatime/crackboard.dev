'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { PublicUser } from '@workspace/core/types';
import type { UpdateUserData } from '@workspace/core/validators';
import { updateUserSchema } from '@workspace/core/validators';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
      <GeneralSettings user={currentUser} />
      <DeleteAccount />
    </main>
  );
}

function GeneralSettings({ user }: { user: PublicUser }) {
  const form = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name ?? '',
      bio: user.bio ?? '',
    },
  });

  const utils = api.useUtils();

  const updateUserMut = api.users.updateUser.useMutation({
    onMutate: () => {
      const toastId = toast.loading('Updating user...');
      return { toastId };
    },
    onSuccess: (data, _vars, ctx) => {
      form.reset({ bio: data.bio ?? '', name: data.name ?? '' });
      void utils.auth.currentUser.invalidate();
      toast.success('User updated successfully', {
        id: ctx.toastId,
      });
    },
    onError: (error, _vars, ctx) => {
      toast.error('Failed to update user', {
        description: error.message,
        id: ctx?.toastId,
      });
    },
  });

  const hanldeSubmit = useCallback(
    (data: UpdateUserData) => {
      updateUserMut.mutate(data);
    },
    [updateUserMut],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(hanldeSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={!form.formState.isDirty || updateUserMut.isPending} type="submit">
              {updateUserMut.isPending ? <LuLoaderCircle className="animate-spin" /> : null}
              Update
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
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
            <Button variant="destructive" disabled={deleteAccountMut.isPending || deleteAccountMut.isSuccess}>
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: 'destructive' })}
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
