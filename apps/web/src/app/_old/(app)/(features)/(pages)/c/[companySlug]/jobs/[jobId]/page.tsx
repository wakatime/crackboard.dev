import { companyToPublicCompany, jobToPublicJob } from '@acme/core/backend/helpers';
import type { JobRole, JobType } from '@acme/core/constants';
import { APP_NAME, jobRoles, jobTypes } from '@acme/core/constants';
import { generateHTML } from '@acme/core/utils';
import { and, db, eq } from '@acme/db/drizzle';
import { Company, Job } from '@acme/db/schema';
import { CompanyProfile } from '@acme/ui/components/company-profile';
import TitleBar from '@acme/ui/components/title-bar';
import { Button } from '@acme/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LuArrowRight, LuChevronsUp, LuClock, LuGlobe, LuUsers } from 'react-icons/lu';

import RegisterDevViewedJob from './register-page-view';
import DevStarredJobButton from './star-button';

interface Props {
  params: Promise<{ jobId: string; companySlug: string }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { jobId } = await params;
  const [row] = await db
    .select({ title: Job.title, companyName: Company.name })
    .from(Job)
    .innerJoin(Company, eq(Company.id, Job.companyId))
    .where(and(eq(Job.id, jobId)));

  if (!row) {
    return {};
  }

  return {
    title: `${row.title} at ${row.companyName} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function Page({ params }: Props) {
  const { companySlug, jobId } = await params;

  const [row] = await db
    .select()
    .from(Job)
    .innerJoin(Company, eq(Company.id, Job.companyId))
    .where(and(eq(Job.id, jobId)));

  if (!row || row.Company.slug !== companySlug || !row.Company.isActive || row.Job.status !== 'open') {
    notFound();
  }

  const [publicCompany, publicJob] = await Promise.all([companyToPublicCompany(row.Company), jobToPublicJob(row.Job)]);

  const descriptionHtml = generateHTML(publicJob.descriptionJSON);

  const jobType = jobTypes[publicJob.type] as JobType | undefined;
  const jobRole = jobRoles[publicJob.role] as JobRole | undefined;

  return (
    <>
      <RegisterDevViewedJob jobId={jobId} />
      <TitleBar
        title={row.Job.title}
        trailing={
          <>
            <DevStarredJobButton jobId={jobId} />
            {publicJob.applicationUrl ? (
              <Button asChild size="sm">
                <Link href={publicJob.applicationUrl} target="_blank" rel="nofollow noopener">
                  Apply Now
                </Link>
              </Button>
            ) : undefined}
          </>
        }
      />
      <div className="mb-16 mt-4 space-y-8">
        <div className="px-4">
          <CompanyProfile company={publicCompany} />
        </div>
        <div className="px-4">
          <Card>
            <CardHeader>
              <CardTitle>{publicJob.title}</CardTitle>
              {publicJob.location && <CardDescription className="text-foreground">{publicJob.location.name}</CardDescription>}
              <CardDescription className="text-foreground">{publicJob.salaryRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {publicJob.isRemote && (
                  <div className="flex items-center text-sm font-medium" title="Job type">
                    <LuGlobe className="mr-1 h-4 w-4" />
                    Remote{publicJob.remoteLocation ? ` (${publicJob.remoteLocation.title})` : ''}
                  </div>
                )}
                <div className="flex items-center text-sm font-medium" title="Job type">
                  <LuClock className="mr-1 h-4 w-4" />
                  {jobType?.name}
                </div>
                <div className="flex items-center text-sm font-medium" title="Experience level">
                  <LuChevronsUp className="mr-1 h-4 w-4" />
                  {publicJob.experience}
                </div>
                <div className="flex items-center text-sm font-medium" title="Job role">
                  <LuUsers className="mr-1 h-4 w-4" />
                  {jobRole?.name}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              {publicJob.applicationUrl && (
                <Button asChild>
                  <Link href={publicJob.applicationUrl} target="_blank" rel="nofollow noopener">
                    Apply Now <LuArrowRight />
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="px-4">
          <h2 className="text-foreground mb-2 text-xl font-bold">About the role</h2>
          <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} className="wonderful-prose" />
        </div>
      </div>
      <div className="h-48"></div>
    </>
  );
}
