import { and, count, desc, eq, gt, inArray, isNotNull, lte, sql } from '@acme/db';
import { db } from '@acme/db/drizzle';
import type { GitHubRepo, IntegrationIdentifier } from '@acme/db/schema';
import {
  Integration,
  IntegrationHistoricalScore,
  IntegrationHistoricalStarredAt,
  ProgramLanguageBadge,
  User,
  UserMetric,
} from '@acme/db/schema';
import { format, isDate, isValid, parse } from 'date-fns';
import decodeIco from 'decode-ico';
import sharp from 'sharp';
import { z } from 'zod';

import {
  MAX_IMAGE_ASPECT_RATIO,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_ASPECT_RATIO,
  MIN_IMAGE_DIMENSION,
} from '../../constants';
import { getConnectionById } from '../../integrations/backend';
import { wonderfulFetch } from '../../integrations/helpers';
import { responseJSON } from '../../validators';

export * from './chat';
export * from './common';
export * from './company';
export * from './job';
export * from './language';
export * from './list';
export * from './notification';
export * from './post';
export * from './suggestions';
export * from './user';

export const integrationParams = async (integrationId: unknown) => {
  const result = z.string().safeParse(integrationId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  const connection = await getConnectionById(result.data);
  return { connection };
};

export type UserMetricColumn =
  | 'lastViewedExploreAt'
  | 'lastViewedHomeAt'
  | 'lastViewedLeadersAt'
  | 'lastViewedLeadersSubpageAt'
  | 'lastViewedOtherProfileAt'
  | 'lastViewedOwnProfileAt'
  | 'lastViewedPollsAt';

export const updateLastViewedTimestamp = async (currentUser: typeof User.$inferSelect, column: UserMetricColumn) => {
  const values = { [column]: new Date() };
  await db
    .insert(UserMetric)
    .values({ id: currentUser.id, ...values })
    .onConflictDoUpdate({ set: values, target: UserMetric.id });
};

export const getLeadersForProviderQuery = (
  provider: IntegrationIdentifier,
  filter:
    | {
        languages?: string[];
      }
    | undefined,
  limit: number,
  cursor: number,
) => {
  const UserIntegrations = db.$with('UserIntegrations').as(
    db
      .select({
        totalScore: sql<number>`cast(sum(${Integration.providerAccountScoreRaw}) as int)`.as('totalScore'),
        userId: Integration.userId,
      })
      .from(Integration)
      .where(eq(Integration.provider, provider))
      .groupBy(Integration.userId),
  );

  if (filter?.languages && filter.languages.length > 0) {
    const programLanguageBadges = db
      .$with('programLanguageBadges')
      .as(
        db
          .select({ userId: ProgramLanguageBadge.userId })
          .from(ProgramLanguageBadge)
          .where(inArray(ProgramLanguageBadge.programLanguageName, filter.languages))
          .groupBy(ProgramLanguageBadge.userId),
      );
    return db
      .with(UserIntegrations, programLanguageBadges)
      .select({ totalScore: UserIntegrations.totalScore, user: User })
      .from(User)
      .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
      .leftJoin(programLanguageBadges, eq(User.id, programLanguageBadges.userId))
      .leftJoin(Integration, eq(User.id, Integration.userId))
      .where(and(isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0), isNotNull(programLanguageBadges.userId)))
      .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
      .groupBy(User.id, UserIntegrations.totalScore)
      .limit(limit)
      .offset(limit * cursor);
  }

  return db
    .with(UserIntegrations)
    .select({ totalScore: UserIntegrations.totalScore, user: User })
    .from(User)
    .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
    .where(and(isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0)))
    .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
    .limit(limit)
    .offset(limit * cursor);
};

export const getLeadersForLanguageQuery = (languageName: string, limit: number, cursor: number) => {
  const UserBadges = db.$with('UserBadges').as(
    db
      .select({
        totalScore: sql<number>`cast(sum(${ProgramLanguageBadge.score}) as int)`.as('totalScore'),
        userId: ProgramLanguageBadge.userId,
      })
      .from(ProgramLanguageBadge)
      .where(eq(ProgramLanguageBadge.programLanguageName, languageName))
      .groupBy(ProgramLanguageBadge.userId),
  );

  return db
    .with(UserBadges)
    .select({ user: User })
    .from(User)
    .leftJoin(UserBadges, eq(User.id, UserBadges.userId))
    .where(and(isNotNull(UserBadges.userId), gt(UserBadges.totalScore, 0)))
    .orderBy(desc(UserBadges.totalScore), desc(User.createdAt))
    .limit(limit)
    .offset(limit * cursor);
};

export const getRepoStarsAtTimeInPast = async (provider: IntegrationIdentifier, repoFullName: string, at: Date) => {
  return (
    (
      await db
        .select({ value: count() })
        .from(IntegrationHistoricalStarredAt)
        .where(
          and(
            eq(IntegrationHistoricalStarredAt.provider, provider),
            eq(IntegrationHistoricalStarredAt.repoFullName, repoFullName),
            lte(IntegrationHistoricalStarredAt.starredAt, at),
          ),
        )
    )[0]?.value ?? 0
  );
};

export const getScoreAtTimeInPast = async (connection: typeof Integration.$inferSelect, at: Date) => {
  return (
    (
      await db.query.IntegrationHistoricalScore.findFirst({
        orderBy: [desc(IntegrationHistoricalScore.date)],
        where: and(
          eq(IntegrationHistoricalScore.provider, connection.provider),
          eq(IntegrationHistoricalScore.providerAccountId, connection.providerAccountId),
          lte(IntegrationHistoricalScore.date, at),
        ),
      })
    )?.score ?? 0
  );
};

// https://archive.org/wayback/available?url=github.com/alanhamlett&timestamp=20240101
export const fetchWayBackMachineArchiveUrl = async (url: string, nearby: Date) => {
  url = url.replace(/^https?:\/\//, '');
  const timestamp = format(nearby, 'yyyyMMdd');
  const params = new URLSearchParams({ timestamp, url });
  const resp = await wonderfulFetch(`https://archive.org/wayback/available?${params.toString()}`, { timeout: 30 });
  if (resp.status !== 200) {
    return;
  }
  const archive = (
    (await responseJSON(resp, {})) as {
      archived_snapshots?: {
        closest?: {
          available: boolean;
          status: string;
          timestamp: string;
          url: string;
        };
      };
    }
  ).archived_snapshots?.closest;
  if (!archive || archive.status !== '200' || !archive.available) {
    return;
  }

  const archivedAt = parse(archive.timestamp, 'yyyyMMddHHmmss', new Date());
  if (!isDate(archivedAt) || !isValid(archivedAt)) {
    return;
  }
  return {
    available: archive.available,
    status: archive.status,
    timestamp: archivedAt,
    url: archive.url,
  };
};

export const sanitizeGitHubRepo = (repo: GitHubRepo): GitHubRepo => {
  // sometimes GitHub returns an array and other times an integer count of forks
  if (typeof repo.forks === 'number') {
    repo.forks = undefined;
  }
  return {
    archived: repo.archived,
    contributors: repo.contributors
      ? repo.contributors.map((u) => {
          return {
            contributions: u.contributions,
            id: u.id,
            node_id: u.node_id,
          };
        })
      : undefined,
    created_at: repo.created_at,
    default_branch: repo.default_branch,
    description: repo.description,
    disabled: repo.disabled,
    fork: repo.fork,
    forks: repo.forks?.map((fork) => {
      return {
        full_name: fork.full_name,
        id: fork.id,
      };
    }),
    forks_count: repo.forks_count,
    full_name: repo.full_name,
    homepage: repo.homepage,
    html_url: repo.html_url,
    id: repo.id,
    language: repo.language,
    languages: repo.languages,
    name: repo.name,
    open_issues_count: repo.open_issues_count,
    owner: repo.owner,
    private: repo.private,
    size: repo.size,
    stargazers: repo.stargazers?.map((u) => {
      return {
        id: u.id,
        node_id: u.node_id,
      };
    }),

    stargazers_count: repo.stargazers_count,
    subscribers: repo.subscribers?.map((u) => {
      return {
        id: u.id,
        node_id: u.node_id,
      };
    }),
    topics: repo.topics,
    updated_at: repo.updated_at,
    url: repo.url,
    visibility: repo.visibility,
    watchers_count: repo.watchers_count,
  };
};

export const typedArrayToBuffer = (array: Uint8Array): ArrayBuffer => {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
};

export const convertIcoImageToPng = async (input: Buffer) => {
  const images = decodeIco(input);
  if (images.length === 0) {
    return;
  }
  const largest = images.reduce((p, c) => (p.width > c.width ? p : c));
  const image =
    largest.type === 'png'
      ? sharp(largest.data)
      : sharp(largest.data, {
          raw: {
            width: largest.width,
            height: largest.height,
            channels: 4,
          },
        }).toFormat('png');
  return await image.toBuffer();
};

export const processImageForUploading = async (
  input: Buffer | Uint8Array,
  opts?: { defaultImageFormat?: 'png' | 'jpg'; forceImageFormat?: 'png' | 'jpg' },
) => {
  opts = opts ?? {};
  opts.defaultImageFormat = opts.defaultImageFormat ?? 'jpg';

  let image = sharp(input).timeout({ seconds: 5 });

  let meta = await image.metadata();

  if ((meta.size ?? MAX_IMAGE_UPLOAD_SIZE + 1) > MAX_IMAGE_UPLOAD_SIZE) {
    return;
  }

  // fix orientation
  image = image.rotate();
  if (!meta.width || !meta.height) {
    return;
  }

  if (meta.width < MIN_IMAGE_DIMENSION || meta.height < MIN_IMAGE_DIMENSION) {
    const scaleFactor = MIN_IMAGE_DIMENSION / Math.min(meta.width, meta.height);
    const newWidth = Math.floor(meta.width * scaleFactor);
    const newHeight = Math.floor(meta.height * scaleFactor);

    image = image.resize({ fit: 'inside', width: newWidth, height: newHeight });
  }

  if (meta.width / meta.height < MIN_IMAGE_ASPECT_RATIO) {
    // image too tall
    image = image.resize({ fit: 'inside', height: Math.floor(meta.width * MIN_IMAGE_ASPECT_RATIO), width: Math.floor(meta.width) });
    meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return;
    }
  }
  if (meta.width / meta.height > MAX_IMAGE_ASPECT_RATIO) {
    // image too wide
    image = image.resize({ fit: 'inside', height: Math.floor(meta.height), width: Math.floor(meta.height * MAX_IMAGE_ASPECT_RATIO) });
    meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return;
    }
  }

  if (meta.width < MIN_IMAGE_DIMENSION || meta.height < MIN_IMAGE_DIMENSION) {
    image = image.resize({ fit: 'outside', width: MIN_IMAGE_DIMENSION, height: MIN_IMAGE_DIMENSION });
    meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return;
    }
  }

  if (meta.width > MAX_IMAGE_DIMENSION || meta.height > MAX_IMAGE_DIMENSION) {
    image = image.resize({ fit: 'contain', width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION });
  }

  if (opts.forceImageFormat) {
    if (opts.forceImageFormat !== meta.format) {
      image = image.toFormat(opts.forceImageFormat);
    }
  } else if (meta.format !== opts.defaultImageFormat) {
    image = image.toFormat(opts.defaultImageFormat);
  }

  const [metadata, buffer] = await Promise.all([image.metadata(), image.toBuffer()]);
  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
  };
};
