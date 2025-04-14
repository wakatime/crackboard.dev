import { getCompany } from '@acme/core/backend/auth';
import { companyToPublicCompany } from '@acme/core/backend/helpers';
import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import StarredList from './_components/starred-list';

interface Props {
  params: Promise<{
    companySlug: string;
  }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { companySlug } = await params;
  const company = await getCompany(companySlug);
  if (!company) {
    return {};
  }

  const publicCompany = await companyToPublicCompany(company);

  return {
    title: `Devs ${publicCompany.name} (@${publicCompany.slug}) has starred - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function FollowersPage({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompany(companySlug);
  if (!company) {
    notFound();
  }

  return <StarredList companyId={company.id} />;
}
