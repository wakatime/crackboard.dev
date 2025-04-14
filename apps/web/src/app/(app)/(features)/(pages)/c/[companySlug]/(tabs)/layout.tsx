import { getCompany } from '@acme/core/backend/auth';
import { companyToPublicCompany } from '@acme/core/backend/helpers';
import TitleBar from '@acme/ui/components/title-bar';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import CompanyTabs from './_components/company-tabs';

interface Props {
  children: ReactNode;
  params: Promise<{ companySlug: string }>;
}

export default async function CompanyTabsLayout({ children, params }: Props) {
  const { companySlug } = await params;
  const company = await getCompany(companySlug);
  if (!company) {
    notFound();
  }
  const publicCompany = await companyToPublicCompany(company);
  return (
    <>
      <TitleBar
        bottom={<CompanyTabs company={publicCompany} />}
        title={
          <div className="flex-1">
            <p className="line-clamp-1 text-lg font-bold leading-6">{publicCompany.name}</p>
            <p className="text-muted-foreground line-clamp-1 text-sm leading-4">@{publicCompany.slug}</p>
          </div>
        }
      />
      {children}
      <div className="h-48"></div>
    </>
  );
}
