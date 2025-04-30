'use client';

import { useEffect } from 'react';

import { api } from '~/trpc/client';

export default function RegisterDevViewedJob({ jobId }: { jobId: string }) {
  const { mutate } = api.jobs.registerDevViewedJob.useMutation();

  useEffect(() => {
    mutate({ jobId });
  }, [jobId, mutate]);

  return null;
}
