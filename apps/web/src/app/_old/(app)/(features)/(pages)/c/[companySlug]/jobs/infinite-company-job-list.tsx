'use client';

import { useEffect } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';

import JobRow from '~/components/job-row';
import { api } from '~/trpc/client';

export default function InfiniteCompanyJobsList({ companyId }: { companyId: string }) {
  const { ref, inView } = useInView();

  const { isPending, isError, error, hasNextPage, isFetchingNextPage, data, fetchNextPage } = api.jobs.getJobsForCompany.useInfiniteQuery(
    { companyId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-muted-foreground p-4">{error.message}</div>;
  }

  return (
    <div>
      {data.pages.map((page) => page.items.map((job) => <JobRow job={job} key={job.id} />))}
      <div className="flex h-48 items-center justify-center" ref={ref}>
        {isFetchingNextPage && <LuLoaderCircle className="h-6 w-6 animate-spin" />}
      </div>
    </div>
  );
}
