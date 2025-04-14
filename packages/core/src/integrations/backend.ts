import { and, db, eq } from '@acme/db/drizzle';
import type { GitHubRepo, GitHubRepoScrape, GitHubUser, GitLabProject } from '@acme/db/schema';
import { Integration, IntegrationIdentifier, IntegrationScrape, IntegrationScrapeRepo } from '@acme/db/schema';
import { subHours } from 'date-fns';
import type { ChatCompletion } from 'openai/resources/index.mjs';

import { getCachedLanguage } from '../backend/helpers';
import { MAX_INTEGRATION_ERRORS } from '../constants';
import type { WakaTimeStats } from '../types';
import { formatNumberWithSuffix } from '../utils';
import { parseJSONObject } from '../validators';
import { getAccessToken, refreshTokenHandler } from './default-helpers';
import { wonderfulFetch } from './helpers';
import { integrations } from './integration-list';

export const refreshTokenIfNeeded = async (connection: typeof Integration.$inferSelect | undefined) => {
  if ((connection?.errorCount ?? 0) > MAX_INTEGRATION_ERRORS) {
    return undefined;
  }
  if (!connection?.refreshToken) {
    return connection;
  }
  if (!connection.expiresAt || connection.expiresAt > new Date()) {
    return connection;
  }

  const config = integrations.find((i) => {
    return i.id === connection.provider;
  });
  if (!config) {
    return connection;
  }

  const id = config.id;
  // eslint-disable-next-line no-restricted-properties
  const secret = process.env[`INTEGRATION_${id.toUpperCase()}_SECRET`];
  if (!secret) {
    return connection;
  }

  // overwrite integration configs in DEV using .env file
  // eslint-disable-next-line no-restricted-properties
  const client_id = process.env[`INTEGRATION_${id.toUpperCase()}_CLIENT_ID`] ?? config.clientId;

  const resp = await refreshTokenHandler(config, secret, client_id, connection.refreshToken);

  const token = await getAccessToken(config, resp);
  if (!token) {
    return connection;
  }

  const rows = await db
    .update(Integration)
    .set({
      accessToken: token.access_token,
      expiresAt: token.expires_at,
      refreshToken: token.refresh_token,
    })
    .where(eq(Integration.id, connection.id))
    .returning();

  if (rows.length === 1) {
    return rows[0];
  }

  return connection;
};

export const getConnectionById = async (integrationId: string) => {
  const connection = await db.query.Integration.findFirst({
    where: eq(Integration.id, integrationId),
    with: { userInfo: { columns: { isBannedForSpam: true } } },
  });
  if (connection?.userInfo.isBannedForSpam) {
    return undefined;
  }

  return await refreshTokenIfNeeded(connection);
};

export const getReposForConnection = async (
  integration: typeof Integration.$inferSelect,
): Promise<
  {
    forks_count: number;
    repo_languages: object;
    repo_url: string;
    stars_count: number;
  }[]
> => {
  switch (integration.provider) {
    case IntegrationIdentifier.GitHub: {
      const scrape = await db.query.IntegrationScrape.findFirst({
        where: and(eq(IntegrationScrape.integrationId, integration.id), eq(IntegrationScrape.scrapeType, 'repos')),
      });
      if (!scrape) {
        return [];
      }
      return (
        await Promise.all(
          ((scrape.jsonValue as { repos?: GitHubRepoScrape[] }).repos ?? []).map(async (repo) => {
            const scrape = await db.query.IntegrationScrapeRepo.findFirst({
              where: and(
                eq(IntegrationScrapeRepo.provider, integration.provider),
                eq(IntegrationScrapeRepo.externalRepoId, String(repo.id)),
              ),
            });
            if ((scrape?.starsCount ?? 0) < 10) {
              return;
            }
            return scrape?.jsonValue as GitHubRepo;
          }),
        )
      )
        .filter((repo) => {
          if (!repo) {
            return false;
          }
          if (!repo.stargazers_count || !repo.forks_count || repo.fork || Object.keys(repo.languages ?? {}).length == 0) {
            return false;
          }
          const id = parseInt(integration.providerAccountId);
          if (repo.owner.id != id) {
            const c = (repo.contributors ?? []).find((c) => c.id == id);
            if (!c) {
              return false;
            }
            const cutoff = (repo.contributors ?? []).map((c) => c.contributions).reduce((c, x) => c + x, 0) / 3;
            if (cutoff == 0) {
              return false;
            }
            return c.contributions >= cutoff;
          }
          return true;
        })
        .filter((repo) => repo !== undefined)
        .map((repo) => {
          return {
            forks_count: (repo.forks ?? []).length,
            repo_languages: repo.languages ?? {},
            repo_url: `https://github.com/${repo.full_name}`,
            stars_count: (repo.stargazers ?? []).length,
          };
        });
    }
    case IntegrationIdentifier.GitLab: {
      const scrape = await db.query.IntegrationScrape.findFirst({
        where: and(eq(IntegrationScrape.integrationId, integration.id), eq(IntegrationScrape.scrapeType, 'repos')),
      });
      if (!scrape) {
        return [];
      }
      const id = parseInt(integration.providerAccountId);
      return ((scrape.jsonValue as { repos?: GitLabProject[] }).repos ?? [])
        .filter((proj) => {
          return proj.star_count > 1 && proj.forks_count > 1 && !proj.forked_from_project && proj.owner?.id == id;
        })
        .map((proj) => {
          return {
            forks_count: proj.forks_count,
            repo_languages: [],
            repo_url: proj.web_url,
            stars_count: proj.star_count,
          };
        });
    }
    default:
      return [];
  }
};

export const getTagsForConnection = async (
  integration: typeof Integration.$inferSelect,
): Promise<{ name: string; score: number; text: string; type: string }[]> => {
  switch (integration.provider) {
    case IntegrationIdentifier.WakaTime: {
      const scrape = await db.query.IntegrationScrape.findFirst({
        where: eq(IntegrationScrape.integrationId, integration.id),
      });
      if (!scrape) {
        return [];
      }
      const category = (scrape.jsonValue as { stats: WakaTimeStats }).stats.categories[0];
      if (category?.name == 'Designing') {
        const editor = (scrape.jsonValue as { stats: WakaTimeStats }).stats.editors[0];
        return [
          { name: editor?.name ?? 'Design App', score: Math.floor(category.total_seconds / 3600), text: category.text, type: 'designing' },
        ];
      }
      return (scrape.jsonValue as { stats: WakaTimeStats }).stats.languages
        .filter((lang) => {
          return lang.total_seconds > 3600 && lang.name != 'Other';
        })
        .map((lang) => {
          return { name: lang.name, score: Math.floor(lang.total_seconds / 3600), text: lang.text, type: 'coding' };
        });
    }
    case IntegrationIdentifier.StackExchange: {
      const scrape = await db.query.IntegrationScrape.findFirst({
        where: eq(IntegrationScrape.integrationId, integration.id),
      });
      if (!scrape) {
        return [];
      }
      return (
        scrape.jsonValue as {
          items: { answer_id?: number; api_site_parameter: string; question_id?: number; score: number; tags: string[] }[];
        }
      ).items
        .filter((item) => item.score > 0)
        .flatMap((item) => {
          return item.tags.map((tag) => {
            const type = item.question_id ? (item.answer_id ? 'comment' : 'answer') : 'question';
            return {
              name: tag,
              score: Math.floor(item.score),
              text: formatNumberWithSuffix(item.score, 'upvote'),
              type: `${item.api_site_parameter} ${type}`,
            };
          });
        });
    }
    default:
      return [];
  }
};

export const parseBioFromGPT = (response?: ChatCompletion | null): string | undefined => {
  const content = response?.choices[0]?.message.content;
  if (!content) {
    return undefined;
  }

  try {
    if (content.split('```json').length > 1) {
      const message = parseJSONObject(content.split('```json')[1]?.split('```')[0] ?? '{}') as { bio?: string };
      if (message.bio) {
        return massageBio(message.bio);
      }
    } else {
      const message = parseJSONObject(content) as { bio?: string };
      if (message.bio) {
        return massageBio(message.bio);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* noop */
  }

  return undefined;
};

const massageBio = (bio: string): string => {
  return bio.replace('a prolific', 'an experienced');
};

export const getGitHubRepo = async (connection: typeof Integration.$inferSelect, repoId: string) => {
  if (!repoId) {
    return null;
  }

  const scrape = await db.query.IntegrationScrapeRepo.findFirst({
    where: and(eq(IntegrationScrapeRepo.externalRepoId, repoId), eq(IntegrationScrapeRepo.provider, connection.provider)),
  });
  if (scrape) {
    return scrape.jsonValue as GitHubRepo;
  }

  const url = `https://api.github.com/repositories/${repoId}`;
  const resp = await wonderfulFetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${connection.accessToken}`,
    },
  });
  if (resp.status !== 200) {
    return null;
  }

  return (await resp.json()) as GitHubRepo;
};

export const isGitHubRepoSignificant = async (connection: typeof Integration.$inferSelect, repo: GitHubRepo) => {
  const sigWatchers = 10;
  const sigContributors = 3;
  if (repo.stargazers_count >= sigWatchers || repo.watchers_count >= sigWatchers || repo.forks_count >= sigWatchers) {
    return true;
  }

  // forked repos can be significant if the fork has many stars, but can't look at contributors of forks because that comes from the original repo
  if (repo.fork) {
    return false;
  }
  if ((repo.contributors?.length ?? 0) >= sigContributors) {
    return true;
  }

  // public timeline interaction type can only be shared from public repos
  if (repo.private) {
    return false;
  }

  if (!repo.contributors) {
    const scrape = await db.query.IntegrationScrapeRepo.findFirst({
      where: and(eq(IntegrationScrapeRepo.externalRepoId, String(repo.id)), eq(IntegrationScrapeRepo.provider, connection.provider)),
    });
    if (scrape) {
      return ((scrape.jsonValue as GitHubRepo).contributors?.length ?? 0) >= sigContributors;
    }
  }

  const url = `${repo.url}/contributors`;
  const resp = await wonderfulFetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${connection.accessToken}`,
    },
  });
  if (resp.status !== 200) {
    return false;
  }

  const contributors = (await resp.json()) as GitHubUser[];
  return contributors.length > sigContributors;
};

export const getProgramLanguageForGitHubRepo = async (connection: typeof Integration.$inferSelect, repo: GitHubRepo) => {
  if (repo.language) {
    return await getCachedLanguage(repo.language);
  }
  if (Object.keys(repo.languages ?? {}).length > 0) {
    const lang = (Object.entries(repo.languages ?? {}) as [string | undefined, number][]).reduce(
      (p, c) => {
        if (c[1] > p[1]) {
          return c;
        }
        return p;
      },
      [undefined, -1],
    )[0];
    if (lang) {
      return await getCachedLanguage(lang);
    } else {
      return;
    }
  }

  const scrape = await db.query.IntegrationScrapeRepo.findFirst({
    where: and(eq(IntegrationScrapeRepo.externalRepoId, String(repo.id)), eq(IntegrationScrapeRepo.provider, connection.provider)),
  });
  if (scrape) {
    const lang = (Object.entries((scrape.jsonValue as GitHubRepo).languages ?? {}) as [string | undefined, number][]).reduce(
      (p, c) => {
        if (c[1] > p[1]) {
          return c;
        }
        return p;
      },
      [undefined, -1],
    )[0];
    if (lang) {
      return await getCachedLanguage(lang);
    } else {
      return undefined;
    }
  }

  const url = `${repo.url}/languages`;
  const resp = await wonderfulFetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${connection.accessToken}`,
    },
  });
  if (resp.status !== 200) {
    return;
  }

  const languages = (await resp.json()) as { string: number };
  const lang = (Object.entries(languages) as [string | undefined, number][]).reduce(
    (p, c) => {
      if (c[1] > p[1]) {
        return c;
      }
      return p;
    },
    [undefined, -1],
  )[0];
  if (lang) {
    return await getCachedLanguage(lang);
  }
};

export const incrementIntegrationErrorCount = async (connection: typeof Integration.$inferSelect) => {
  await db
    .update(Integration)
    .set({
      errorCount: connection.errorCount + 1,
    })
    .where(eq(Integration.id, connection.id));
};

export const resetIntegrationErrorCount = async (connection: typeof Integration.$inferSelect) => {
  if (connection.errorCount > 0) {
    await db
      .update(Integration)
      .set({
        errorCount: 0,
      })
      .where(eq(Integration.id, connection.id));
  }
};

export const canScrapeConnection = (connection: typeof Integration.$inferSelect | undefined) => {
  if (!connection) {
    return false;
  }
  if (connection.errorCount > MAX_INTEGRATION_ERRORS) {
    return false;
  }
  return true;
};

export const getScrapeForConnection = async (
  connection: typeof Integration.$inferSelect,
  scrapeType: string,
  columns?: {
    integrationId?: boolean;
    jsonValue?: boolean;
    provider?: boolean;
    scrapeType?: boolean;
    scrapedAt?: boolean;
    userId?: boolean;
  },
) => {
  return await db.query.IntegrationScrape.findFirst({
    columns,
    where: and(
      eq(IntegrationScrape.userId, connection.userId),
      eq(IntegrationScrape.scrapeType, scrapeType),
      eq(IntegrationScrape.provider, connection.provider),
    ),
  });
};

export const updateScrapeForConnection = async (
  connection: typeof Integration.$inferSelect,
  scrapeType: string,
  jsonValue: unknown,
  updateScrapedAt?: boolean,
) => {
  if (!jsonValue || typeof jsonValue !== 'object') {
    throw Error(`Updating scrape with non-object json value: ${typeof jsonValue}`);
  }
  const prevScrapedAt = connection.lastScrapedAt;
  if (updateScrapedAt) {
    await db
      .update(Integration)
      .set({
        lastScrapedAt: new Date(),
      })
      .where(eq(Integration.id, connection.id));
  }
  await db
    .insert(IntegrationScrape)
    .values({
      integrationId: connection.id,
      jsonValue,
      provider: connection.provider,
      scrapeType,
      userId: connection.userId,
    })
    .onConflictDoUpdate({
      set: {
        jsonValue,
        scrapedAt: new Date(),
      },
      target: [IntegrationScrape.userId, IntegrationScrape.integrationId, IntegrationScrape.scrapeType],
    });
  return !prevScrapedAt;
};

export const canSyncTimelineForConnection = (connection: typeof Integration.$inferSelect | undefined) => {
  if (!connection) {
    return false;
  }
  if (connection.errorCount > MAX_INTEGRATION_ERRORS) {
    return;
  }
  if (connection.lastSyncTimelineAt && connection.lastSyncTimelineAt > subHours(new Date(), 10)) {
    return false;
  }
  return true;
};

export const canSyncMilestonesForConnection = (connection: typeof Integration.$inferSelect | undefined) => {
  if (!connection) {
    return false;
  }
  if (connection.errorCount > MAX_INTEGRATION_ERRORS) {
    return;
  }
  if (connection.lastSyncMilestonesAt && connection.lastSyncMilestonesAt > subHours(new Date(), 10)) {
    return false;
  }
  return true;
};
