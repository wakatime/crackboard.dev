import { COMPANY_AUDIT_LOG_COMPANY_CREATED, COMPANY_AUDIT_LOG_COMPANY_USER_JOINED_COMPANY } from '@acme/core/constants';
import { getDomainFromUrl } from '@acme/core/utils';
import { and, count, desc, eq } from '@acme/db';
import { db, isNull } from '@acme/db/drizzle';
import type { PublicCompany, PublicCompanyUser } from '@acme/db/schema';
import {
  Company,
  CompanyAuditLog,
  CompanyDomain,
  CompanyStarredDev,
  CompanyTechnology,
  CompanyUser,
  DevStarredCompany,
  DomainManifest,
  Job,
  Technology,
} from '@acme/db/schema';
import { headers } from 'next/headers';
import slugify from 'slugify';

import { generateHTML } from '../../utils';

export const companyUserToPublicCompanyUser = async (
  user: typeof CompanyUser.$inferSelect & { company?: typeof Company.$inferSelect },
): Promise<PublicCompanyUser> => {
  if (!user.company && user.companyId) {
    user.company = await db.query.Company.findFirst({ where: eq(Company.id, user.companyId) });
  }
  return {
    createdAt: user.createdAt,
    id: user.id,
    email: user.email,
    role: user.role,
    company: user.company ? await companyToPublicCompany(user.company) : null,
  } as PublicCompanyUser;
};

export const hasCompanyStarredDev = async (companyId: string, devId: string) => {
  return (
    (
      await db
        .select()
        .from(CompanyStarredDev)
        .where(and(eq(CompanyStarredDev.companyId, companyId), eq(CompanyStarredDev.userId, devId)))
    ).length > 0
  );
};

export const hasDevStarredCompany = async (devId: string, companyId: string) => {
  return (
    (
      await db
        .select()
        .from(DevStarredCompany)
        .where(and(eq(DevStarredCompany.userId, devId), eq(DevStarredCompany.companyId, companyId)))
    ).length > 0
  );
};

export const companyToPublicCompany = async (company: typeof Company.$inferSelect, viewerId?: string): Promise<PublicCompany> => {
  let iconUrl: string | null = null;
  if (company.websiteUrl) {
    const domain = getDomainFromUrl(company.websiteUrl);
    if (domain) {
      const manifest = await db.query.DomainManifest.findFirst({ where: eq(DomainManifest.domain, domain) });
      if (manifest) {
        iconUrl = faviconUrlFromDomainManifest(manifest);
      }
    }
  }

  const starredCountPromise = db
    .select({ count: count() })
    .from(CompanyStarredDev)
    .where(eq(CompanyStarredDev.companyId, company.id))
    .then((results) => results.at(0)?.count ?? 0);
  const starsCountPromise = db
    .select({ count: count() })
    .from(DevStarredCompany)
    .where(eq(DevStarredCompany.companyId, company.id))
    .then((results) => results.at(0)?.count ?? 0);
  const jobsCountPromise = db
    .select({ count: count() })
    .from(Job)
    .where(and(eq(Job.companyId, company.id), eq(Job.status, 'open')))
    .then((results) => results.at(0)?.count ?? 0);

  const techStackPromise = db
    .select({ id: Technology.id, name: Technology.name, category: Technology.category, description: Technology.description })
    .from(CompanyTechnology)
    .innerJoin(Technology, eq(Technology.id, CompanyTechnology.technologyId))
    .where(eq(CompanyTechnology.companyId, company.id))
    .orderBy(desc(CompanyTechnology.createdAt));

  const getIsStarred = async () => {
    if (!viewerId) {
      return false;
    }
    return !!(await db.query.DevStarredCompany.findFirst({
      where: and(eq(DevStarredCompany.userId, viewerId), eq(DevStarredCompany.companyId, company.id)),
    }));
  };

  const [starsCount, starredCount, jobsCount, techStack, isStarred] = await Promise.all([
    starsCountPromise,
    starredCountPromise,
    jobsCountPromise,
    techStackPromise,
    getIsStarred(),
  ]);

  let descriptionHTML: string | null = null;
  if (company.descriptionJSON) {
    descriptionHTML = generateHTML(company.descriptionJSON);
  }

  return {
    createdAt: company.createdAt,
    id: company.id,
    name: company.name,
    slug: company.slug,
    websiteUrl: company.websiteUrl,
    iconUrl,
    isStarred,
    starsCount,
    starredCount,
    jobsCount,
    description: company.description,
    descriptionJSON: company.descriptionJSON,
    shortDescription: company.shortDescription,
    descriptionHTML,
    techStack,
  } satisfies PublicCompany;
};

export const faviconUrlFromDomainManifest = (manifest: typeof DomainManifest.$inferSelect) => {
  if (!manifest.faviconId) {
    return null;
  }
  return `https://img.wonderful.dev/favicon/${manifest.faviconId}`;
};

export const getOrCreateCompany = async (
  user: { id: string; email: string; companyId: string | null | undefined },
  skipAuditLog = false,
) => {
  const domain = getDomainFromUrl(user.email);
  if (!domain) {
    throw Error(`Unable to parse domain from email: ${user.email}`);
  }

  const existingCompany = (
    await db.query.CompanyDomain.findFirst({
      where: eq(CompanyDomain.domain, domain),
      with: { company: true },
    })
  )?.company;
  if (existingCompany) {
    if (!user.companyId) {
      await db.transaction(async (tx) => {
        await tx
          .update(CompanyUser)
          .set({ companyId: existingCompany.id, role: 'member' })
          .where(and(eq(CompanyUser.id, user.id), isNull(CompanyUser.companyId)));
        if (!skipAuditLog) {
          const headersObj = await headers();
          await tx.insert(CompanyAuditLog).values({
            event: COMPANY_AUDIT_LOG_COMPANY_USER_JOINED_COMPANY,
            ip: headersObj.get('X-Forwarded-For') ?? '',
            userAgent: headersObj.get('user-agent'),
            companyId: existingCompany.id,
            userId: user.id,
          });
        }
      });
      return { created: false, company: undefined };
    }

    if (user.companyId === existingCompany.id) {
      return { created: false, company: undefined };
    }

    throw Error(`User(${user.email}) already has company: ${user.companyId}`);
  }

  const slug = slugify(domain, { lower: true, strict: true });
  const newCompany = await db.transaction(async (tx) => {
    const [newCompany] = await tx
      .insert(Company)
      .values({ name: domain, slug, websiteUrl: `https://${domain}` })
      .returning();
    if (!newCompany) {
      return;
    }
    await tx.insert(CompanyDomain).values({
      createdByCompanyUserId: user.id,
      companyId: newCompany.id,
      domain,
    });
    if (!skipAuditLog) {
      const headersObj = await headers();
      await tx.insert(CompanyAuditLog).values({
        event: COMPANY_AUDIT_LOG_COMPANY_CREATED,
        ip: headersObj.get('X-Forwarded-For') ?? '',
        userAgent: headersObj.get('user-agent'),
        companyId: newCompany.id,
        userId: user.id,
      });
    }
    return newCompany;
  });
  if (newCompany) {
    await db
      .update(CompanyUser)
      .set({ companyId: newCompany.id, role: 'owner' })
      .where(and(eq(CompanyUser.id, user.id), isNull(CompanyUser.companyId)));
    return { created: true, company: newCompany };
  } else {
    const d = await db.query.CompanyDomain.findFirst({ where: eq(CompanyDomain.domain, domain), columns: { companyId: true } });
    if (d) {
      const [updated] = await db
        .update(CompanyUser)
        .set({ companyId: d.companyId, role: 'member' })
        .where(and(eq(CompanyUser.id, user.id), isNull(CompanyUser.companyId)))
        .returning();
      if (updated && !skipAuditLog) {
        const headersObj = await headers();
        await db.insert(CompanyAuditLog).values({
          event: COMPANY_AUDIT_LOG_COMPANY_USER_JOINED_COMPANY,
          ip: headersObj.get('X-Forwarded-For') ?? '',
          userAgent: headersObj.get('user-agent'),
          companyId: d.companyId,
          userId: user.id,
        });
      }
      return { created: false, company: newCompany };
    }
  }

  throw Error(`Unable to create company for: ${user.email}`);
};
