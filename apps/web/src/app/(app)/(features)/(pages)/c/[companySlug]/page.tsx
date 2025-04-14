import { authenticatedUserFromRequest } from '@acme/core/backend/auth';
import { companyToPublicCompany, jobToPublicJob } from '@acme/core/backend/helpers';
import { APP_NAME } from '@acme/core/constants';
import { db, desc, eq } from '@acme/db/drizzle';
import type { PublicCompany } from '@acme/db/schema';
import { Company, Job } from '@acme/db/schema';
import { CompanyProfile } from '@acme/ui/components/company-profile';
import TitleBar from '@acme/ui/components/title-bar';
import { Button } from '@acme/ui/components/ui/button';
import { Separator } from '@acme/ui/components/ui/separator';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { LuArrowRight } from 'react-icons/lu';

import JobRow from '~/components/job-row';

import RegisterDevViewedCompany from './register-page-view';
import DevStarredCompanyButton from './star-button';

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

  const desc = company.shortDescription ? `: ${company.shortDescription}` : '';

  return {
    title: `${company.name}${desc} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function Page({ params }: Props) {
  const currentUser = await authenticatedUserFromRequest();
  const { companySlug } = await params;
  const company = await db.query.Company.findFirst({ where: eq(Company.slug, companySlug) });

  if (!company?.isActive) {
    notFound();
  }
  const publicCompany = await companyToPublicCompany(company, currentUser?.id);

  return (
    <>
      <RegisterDevViewedCompany companyId={publicCompany.id} />
      <TitleBar
        title={publicCompany.name}
        trailing={
          <DevStarredCompanyButton
            company={{ id: publicCompany.id, starsCount: publicCompany.starsCount, isStarred: publicCompany.isStarred }}
          />
        }
      />
      <CompanyProfile company={publicCompany} />
      <Separator />
      <div className="my-8 space-y-8">
        <CompanyDescription company={publicCompany} />
        <TechStack company={publicCompany} />
        <Suspense fallback={null}>
          <JobsList company={publicCompany} />
        </Suspense>
      </div>
      <div className="h-48"></div>
    </>
  );
}

function CompanyDescription({ company }: { company: PublicCompany }) {
  if (company.descriptionHTML) {
    return (
      <section id="description" className="px-4">
        <div dangerouslySetInnerHTML={{ __html: company.descriptionHTML }} className="wonderful-prose" />
      </section>
    );
  }

  if (company.description) {
    return (
      <section id="description" className="px-4">
        <p className="whitespace-pre-wrap leading-normal">{company.description}</p>
      </section>
    );
  }

  return null;
}

async function JobsList({ company }: { company: PublicCompany }) {
  const items = await db.select().from(Job).where(eq(Job.companyId, company.id)).limit(10).orderBy(desc(Job.createdAt));

  if (items.length === 0) {
    return null;
  }

  const publicJobs = await Promise.all(items.map((job) => jobToPublicJob(job, company)));

  return (
    <section id="jobs">
      <div className="flex items-center justify-between gap-4 px-4">
        <h2 className="font-semibold">Jobs at {company.name}</h2>
        <Button asChild className="h-fit px-0" variant="link">
          <Link href={`/c/${company.slug}/jobs`}>
            See All
            <LuArrowRight />
          </Link>
        </Button>
      </div>
      <div>
        {publicJobs.map((job) => (
          <JobRow job={job} key={job.id} />
        ))}
      </div>
    </section>
  );
}

function TechStack({ company }: { company: PublicCompany }) {
  if (!company.techStack || company.techStack.length === 0) {
    return null;
  }

  return (
    <section id="tech-stack">
      <div className="flex items-center justify-between gap-4 px-4">
        <h2 className="font-semibold">Tech Stack</h2>
      </div>
      <div className="flex flex-wrap gap-2 p-4 pb-0">
        {company.techStack.map((tech) => (
          <div key={tech.id} className="flex h-8 items-center rounded-full border px-3">
            <span className="text-sm font-medium">{tech.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
