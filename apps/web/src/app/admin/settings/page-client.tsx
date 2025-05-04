'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateLeaderboardConfigData } from '@workspace/core/validators';
import { updateLeaderboardConfigSchema } from '@workspace/core/validators';
import type { LeaderboardConfig } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Switch } from '@workspace/ui/components/switch';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '~/trpc/client';

export default function PageClient() {
  const leaderboardConfigQuery = api.admin.leaderboardConfig.getConfig.useQuery();

  return (
    <>
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <p className="text-lg font-bold">Settings</p>
      </header>

      <div className="container mx-auto my-8 max-w-4xl space-y-8 px-4 md:px-8">
        {leaderboardConfigQuery.isPending ? (
          <p>Loading...</p>
        ) : leaderboardConfigQuery.isError ? (
          <p>{leaderboardConfigQuery.error.message}</p>
        ) : (
          <LeaderboardConfigUpdateForm config={leaderboardConfigQuery.data} />
        )}
      </div>
    </>
  );
}

function LeaderboardConfigUpdateForm({ config }: { config: typeof LeaderboardConfig.$inferSelect }) {
  const form = useForm<UpdateLeaderboardConfigData>({
    resolver: zodResolver(updateLeaderboardConfigSchema),
    defaultValues: config,
  });

  const updateLeaderboardConfigMut = api.admin.leaderboardConfig.updateConfig.useMutation({
    onSuccess: (data) => {
      form.reset(data);
      toast.success('Updated successfully.');
    },
    onError: (error) => {
      toast.error('Failed to update leaderboard', {
        description: error.message,
      });
    },
  });

  const handleSubmit = useCallback(
    (data: UpdateLeaderboardConfigData) => {
      updateLeaderboardConfigMut.mutate(data);
    },
    [updateLeaderboardConfigMut],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard Settings</CardTitle>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex">
                  <FormLabel>Is publicly viewable?</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardContent>
            <FormField
              control={form.control}
              name="isInviteOnly"
              render={({ field }) => (
                <FormItem className="flex">
                  <FormLabel>Require approval for new signups?</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={updateLeaderboardConfigMut.isPending || !form.formState.isDirty}>
              Update
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
