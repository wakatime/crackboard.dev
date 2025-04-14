import { count, eq } from '@acme/db';
import { db } from '@acme/db/drizzle';
import type { Job, PublicCity, PublicCompany, PublicJob } from '@acme/db/schema';
import { City, Company, DevStarredJob } from '@acme/db/schema';

import { CURRENCIES } from '../../constants';
import { formatNumber, generateHTML } from '../../utils';
import { cityToPublicCity } from './common';
import { companyToPublicCompany } from './company';

export const formatPayment = (job: typeof Job.$inferSelect) => {
  const currencySymbol = CURRENCIES[job.currency]?.symbol ?? '$';
  const minPayStr = currencySymbol + formatNumber(job.minPay);
  const maxPayStr = currencySymbol + formatNumber(job.maxPay);

  if (job.minPay === job.maxPay) {
    return job.paymentType === 'salary'
      ? `${maxPayStr} per year`
      : job.paymentType === 'hourly'
        ? `${maxPayStr}/hr`
        : `budget ${maxPayStr}`;
  }

  return job.paymentType === 'salary'
    ? `${minPayStr} - ${maxPayStr} per year`
    : job.paymentType === 'hourly'
      ? `${minPayStr}/hr - ${maxPayStr}/hr`
      : `budget ${minPayStr} - ${maxPayStr}`;
};

export const jobToPublicJob = async (job: typeof Job.$inferSelect, company?: PublicCompany): Promise<PublicJob> => {
  let location: PublicCity | null = null;
  if (job.location) {
    const [city] = await db.select().from(City).where(eq(City.id, job.location));
    if (!city) {
      throw new Error('location not found!');
    }
    location = cityToPublicCity(city);
  }

  let remoteLocation: PublicCity | null = null;
  if (job.isRemote && job.remoteLocation) {
    const [city] = await db.select().from(City).where(eq(City.id, job.remoteLocation));
    if (!city) {
      throw new Error('remote location not found!');
    }
    remoteLocation = cityToPublicCity(city);
  }

  if (!company) {
    const [comp] = await db.select().from(Company).where(eq(Company.id, job.companyId));
    if (!comp) {
      throw new Error('Company not found!');
    }
    company = await companyToPublicCompany(comp);
  }

  const starCountPromise = db
    .select({ count: count() })
    .from(DevStarredJob)
    .where(eq(DevStarredJob.jobId, job.id))
    .then((res) => res[0]?.count ?? 0);

  const [starCount] = await Promise.all([starCountPromise]);

  const descriptionHTML = generateHTML(job.descriptionJSON);

  return {
    id: job.id,
    applicationDeadline: job.applicationDeadline,
    companyId: job.companyId,
    createdAt: job.createdAt,
    currency: job.currency,
    description: job.description,
    experience: job.experience,
    isRemote: job.isRemote,
    location,
    remoteLocation,
    role: job.role,
    minPay: job.minPay,
    maxPay: job.maxPay,
    status: job.status,
    title: job.title,
    type: job.type,
    updatedAt: job.updatedAt,
    descriptionJSON: job.descriptionJSON,
    closedAt: job.closedAt,
    archivedAt: job.archivedAt,
    company,
    salaryRange: formatPayment(job),
    paymentType: job.paymentType,
    applicationUrl: job.applicationUrl,
    starCount,
    descriptionHTML,
  };
};
