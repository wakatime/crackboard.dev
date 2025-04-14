'use client';

import { formatNumber } from '@acme/core/utils';
import { Button } from '@acme/ui/components/ui/button';
import { Skeleton } from '@acme/ui/components/ui/skeleton';
import { toast } from '@acme/ui/components/ui/sonner';
import { cn } from '@acme/ui/lib/utils';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { IoStarOutline, IoStarSharp } from 'react-icons/io5';

import { useStarJobMutation, useUnstarJobMutation } from '~/hooks/mutations/job';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function DevStarredJobButton({ jobId }: { jobId: string }) {
  const { isAuthenticated } = useAuth();
  const starStatusQuery = api.jobs.starStatus.useQuery(jobId);
  const router = useRouter();

  const starJobMut = useStarJobMutation();
  const unStarJobMut = useUnstarJobMutation();

  const toggleDevStarredJob = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/flow/login?next=${encodeURIComponent(window.location.href)}`);
      toast.error('Unauthorized');
      return;
    }

    if (!starStatusQuery.isSuccess || starJobMut.isPending || unStarJobMut.isPending) {
      return;
    }

    if (starStatusQuery.data.starred) {
      unStarJobMut.mutate(jobId);
    } else {
      starJobMut.mutate(jobId);
    }
  }, [isAuthenticated, jobId, starStatusQuery, router, starJobMut, unStarJobMut]);

  useEffect(() => {
    if (starStatusQuery.isError) {
      toast.error(starStatusQuery.error.message);
    }
  }, [starStatusQuery.error?.message, starStatusQuery.isError]);

  if (!starStatusQuery.isSuccess) {
    return <Skeleton className="h-10 w-24" />;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggleDevStarredJob}
      disabled={starJobMut.isPending || unStarJobMut.isPending}
      className={cn('py-0', {
        'bg-secondary/50': starStatusQuery.data,
      })}
    >
      {starStatusQuery.data.starred ? <IoStarSharp className="-ml-1" /> : <IoStarOutline className="-ml-1" />}
      <span>{starStatusQuery.data.starred ? 'Starred' : 'Star'}</span>
      <span className="bg-border flex h-5 items-center justify-center rounded-full px-1.5 text-center align-top text-xs font-bold leading-none">
        {formatNumber(starStatusQuery.data.starCount)}
      </span>
    </Button>
  );
}
