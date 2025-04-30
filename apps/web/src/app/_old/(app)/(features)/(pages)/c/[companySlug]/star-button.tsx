'use client';

import { formatNumber } from '@acme/core/utils';
import type { PublicCompany } from '@acme/db/schema';
import { Button } from '@acme/ui/components/ui/button';
import { Skeleton } from '@acme/ui/components/ui/skeleton';
import { toast } from '@acme/ui/components/ui/sonner';
import { cn } from '@acme/ui/lib/utils';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { IoStarOutline, IoStarSharp } from 'react-icons/io5';

import { useStarCompanyMutation, useUnstarCompanyMutation } from '~/hooks/mutations/company';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function DevStarredCompanyButton({ company }: { company: Pick<PublicCompany, 'id' | 'isStarred' | 'starsCount'> }) {
  const { isAuthenticated } = useAuth();
  const starStatusQuery = api.companies.starStatus.useQuery(company.id, {
    initialData: {
      starred: company.isStarred ?? false,
      starCount: company.starsCount,
    },
  });
  const router = useRouter();

  const starCompanyMut = useStarCompanyMutation();
  const unstarCompanyMut = useUnstarCompanyMutation();

  const toggleDevStarredJob = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/flow/login?next=${encodeURIComponent(window.location.href)}`);
      toast.error('Unauthorized');
      return;
    }

    if (!starStatusQuery.isSuccess || starCompanyMut.isPending || unstarCompanyMut.isPending) {
      return;
    }

    if (starStatusQuery.data.starred) {
      unstarCompanyMut.mutate(company.id);
    } else {
      starCompanyMut.mutate(company.id);
    }
  }, [company.id, isAuthenticated, router, starCompanyMut, starStatusQuery, unstarCompanyMut]);

  useEffect(() => {
    if (starStatusQuery.isError) {
      toast.error(starStatusQuery.error.message);
    }
  }, [starStatusQuery.error?.message, starStatusQuery.isError]);

  if (!starStatusQuery.isSuccess) {
    return <Skeleton className="h-10 w-10" />;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={toggleDevStarredJob}
      disabled={starCompanyMut.isPending || unstarCompanyMut.isPending}
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
