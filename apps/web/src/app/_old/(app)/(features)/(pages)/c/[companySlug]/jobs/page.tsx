import { APP_NAME } from '@acme/core/constants';
import { db, eq } from '@acme/db/drizzle';
import { Company } from '@acme/db/schema';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import InfiniteCompanyJobsList from './infinite-company-job-list';

export interface Props {
  params: Promise<{ companySlug: string }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { companySlug } = await params;
  const company = await db.query.Company.findFirst({
    where: eq(Company.slug, companySlug),
    columns: { name: true, shortDescription: true },
  });
  if (!company) {
    return {};
  }

  return {
    title: `Jobs at ${company.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function Page({ params }: Props) {
  const { companySlug } = await params;
  const company = await db.query.Company.findFirst({ where: eq(Company.slug, companySlug) });

  if (!company?.isActive) {
    notFound();
  }

  return (
    <>
      <TitleBar title={`Jobs at ${company.name}`} />
      <InfiniteCompanyJobsList companyId={company.id} />
      <div className="h-48"></div>
    </>
  );
}
