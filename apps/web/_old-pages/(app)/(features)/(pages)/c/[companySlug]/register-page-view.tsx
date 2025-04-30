'use client';

import { useEffect } from 'react';

import { api } from '~/trpc/client';

export default function RegisterDevViewedCompany({ companyId }: { companyId: string }) {
  const { mutate } = api.companies.registerDevViewedCompany.useMutation();

  useEffect(() => {
    mutate({ companyId });
  }, [companyId, mutate]);

  return null;
}
