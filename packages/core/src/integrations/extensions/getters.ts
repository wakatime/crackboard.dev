import type { Integration } from '@acme/db/schema';
import { IntegrationIdentifier } from '@acme/db/schema';
import { siWakatime } from 'simple-icons';

import type {
  HackerNoonUser,
  InstagramUser,
  IntegrationConnection,
  IntegrationSubConnection,
  InternalIntegration,
  KofiUser,
  PatreonUser,
  RedditUser,
  StackExchangeUser,
  TikTokUser,
  TwitterUser,
  UnsplashUser,
  WakaTimeUser,
  WikipediaUser,
  YCombinatorUser,
  YouTubeChannel,
} from '../../types';
import { formatNumber, formatNumberWithSuffix, getSuffixForNumber, roundWithPrecision } from '../../utils';

export const avatarForConnection = (
  connection?: IntegrationConnection,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): string | undefined => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider || !providerInfo) {
    return undefined;
  }
  switch (provider) {
    case IntegrationIdentifier.GitHub:
    case IntegrationIdentifier.GitLab:
      return (providerInfo as { avatar_url: string }).avatar_url.replace('s=80', 's=420');
    case IntegrationIdentifier.StackExchange: {
      const site = (providerInfo as { profile_image: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .reverse()
        .find((c) => {
          return !!c.profile_image;
        });
      return site?.profile_image;
    }
    case IntegrationIdentifier.X:
      return (providerInfo as TwitterUser).legacy.profile_image_url_https.replace('_normal', '');
    case IntegrationIdentifier.WakaTime:
      return (providerInfo as { photo: string }).photo;
    case IntegrationIdentifier.LinkedIn:
      return (providerInfo as { userInfo: { picture: string } }).userInfo.picture;
    case IntegrationIdentifier.Twitch:
      return (providerInfo as { profile_image_url: string }).profile_image_url;
    case IntegrationIdentifier.ProductHunt:
      return (providerInfo as { user: { profileImage: string } }).user.profileImage;
    case IntegrationIdentifier.YouTube:
      return (
        (providerInfo as YouTubeChannel).snippet.thumbnails.high?.url ?? (providerInfo as YouTubeChannel).snippet.thumbnails.default?.url
      );
    case IntegrationIdentifier.Unsplash:
      return (providerInfo as UnsplashUser).profile_image.large;
    case IntegrationIdentifier.Instagram:
      return (providerInfo as InstagramUser).profile_pic_url;
    case IntegrationIdentifier.Tiktok:
      return (providerInfo as TikTokUser).avatar_large_url;
    case IntegrationIdentifier.YCombinator:
      return undefined;
    case IntegrationIdentifier.Wikipedia:
      return undefined;
    case IntegrationIdentifier.Reddit:
      return (providerInfo as RedditUser).icon_img;
    case IntegrationIdentifier.Patreon:
      return (providerInfo as PatreonUser).image_url ?? undefined;
    case IntegrationIdentifier.KoFi:
      return (providerInfo as KofiUser).avatarUrl ?? undefined;
  }
};

export const websiteUrlForConnection = (
  connection: IntegrationConnection | undefined,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): string | null | undefined => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider || !providerInfo) {
    return undefined;
  }
  switch (provider) {
    case IntegrationIdentifier.GitHub:
      return (providerInfo as { blog: string }).blog;
    case IntegrationIdentifier.GitLab:
      return (providerInfo as { website_url: string }).website_url;
    case IntegrationIdentifier.StackExchange: {
      const site = (providerInfo as { reputation: number; website_url?: string }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .reverse()
        .find((c) => {
          return !!c.website_url;
        });
      return site?.website_url;
    }
    case IntegrationIdentifier.X:
      return (providerInfo as TwitterUser).legacy.entities?.url?.urls[0]?.expanded_url;
    case IntegrationIdentifier.WakaTime:
      return (providerInfo as { website: string }).website;
    case IntegrationIdentifier.LinkedIn:
      return undefined;
    case IntegrationIdentifier.Twitch:
      return undefined;
    case IntegrationIdentifier.ProductHunt:
      return (providerInfo as { user: { websiteUrl: string } }).user.websiteUrl;
    case IntegrationIdentifier.YouTube:
      return undefined;
    case IntegrationIdentifier.Unsplash:
      return (providerInfo as UnsplashUser).portfolio_url;
    case IntegrationIdentifier.Instagram:
      return (providerInfo as InstagramUser).external_url;
    case IntegrationIdentifier.Tiktok:
      return undefined;
    case IntegrationIdentifier.YCombinator:
      return undefined;
    case IntegrationIdentifier.Wikipedia:
      return undefined;
    case IntegrationIdentifier.Reddit:
    case IntegrationIdentifier.Patreon:
    case IntegrationIdentifier.KoFi:
      return undefined;
  }
};

export const nameForConnection = (
  connection: IntegrationConnection | undefined,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): string | undefined => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider || !providerInfo) {
    return undefined;
  }
  switch (provider) {
    case IntegrationIdentifier.GitHub:
    case IntegrationIdentifier.GitLab:
      return (providerInfo as { name: string }).name;
    case IntegrationIdentifier.StackExchange: {
      const site = (providerInfo as { display_name: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .reverse()
        .find((c) => {
          return !!c.display_name;
        });
      return site?.display_name;
    }
    case IntegrationIdentifier.X:
      return (providerInfo as TwitterUser).legacy.name;
    case IntegrationIdentifier.WakaTime:
      return (providerInfo as { full_name: string }).full_name;
    case IntegrationIdentifier.LinkedIn:
      return (providerInfo as { userInfo: { name: string } }).userInfo.name;
    case IntegrationIdentifier.Twitch:
      return (providerInfo as { display_name: string }).display_name;
    case IntegrationIdentifier.ProductHunt:
      return (providerInfo as { user: { name: string } }).user.name;
    case IntegrationIdentifier.YouTube:
      return (providerInfo as YouTubeChannel).snippet.title ?? (providerInfo as YouTubeChannel).snippet.customUrl;
    case IntegrationIdentifier.Unsplash:
      return (providerInfo as UnsplashUser).name;
    case IntegrationIdentifier.Instagram:
      return (providerInfo as InstagramUser).full_name ?? undefined;
    case IntegrationIdentifier.Tiktok:
      return (providerInfo as TikTokUser).display_name;
    case IntegrationIdentifier.YCombinator:
      return undefined;
    case IntegrationIdentifier.Wikipedia:
      return undefined;
    case IntegrationIdentifier.Reddit:
      return (providerInfo as RedditUser).name;
    case IntegrationIdentifier.Patreon:
      return (providerInfo as PatreonUser).full_name ?? undefined;
    case IntegrationIdentifier.KoFi:
      return (providerInfo as KofiUser).name;
  }
};

export const urlForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): string => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    case IntegrationIdentifier.GitHub:
      return `https://github.com/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.GitLab:
      return `https://gitlab.com/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.StackExchange: {
      const site = (providerInfo as { link: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .reverse()
        .find((c) => {
          return !!c.link;
        });
      return site?.link ?? '';
    }
    case IntegrationIdentifier.X:
      return `https://x.com/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.WakaTime:
      return `https://wakatime.com/@${connection?.providerAccountId}`;
    /*
    case 'bitbucket':
      return `https://bitbucket.org/${connection?.providerAccountUsername}`;
    */
    case IntegrationIdentifier.LinkedIn:
      return `https://linkedin.com/in/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Twitch:
      return `https://twitch.tv/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.ProductHunt:
      return `https://producthunt.com/@${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.YouTube: {
      const c = providerInfo as YouTubeChannel;
      return c.snippet.customUrl ? `https://youtube.com/${c.snippet.customUrl}` : `https://www.youtube.com/channel/${c.id}`;
    }
    case IntegrationIdentifier.Unsplash:
      return `https://unsplash.com/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Instagram:
      return `https://instagram.com/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Tiktok:
      return (connection?.providerInfo as TikTokUser).profile_deep_link;
    case IntegrationIdentifier.YCombinator:
      return `https://news.ycombinator.com/user?id=${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Wikipedia:
      return `https://en.wikipedia.org/wiki/Special:CentralAuth/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Reddit:
      return `https://www.reddit.com/u/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.Patreon:
      return (providerInfo as PatreonUser).url;
    case IntegrationIdentifier.HackerNoon:
      return `https://hackernoon.com/u/${connection?.providerAccountUsername}`;
    case IntegrationIdentifier.KoFi:
      return `https://ko-fi.com/${connection?.providerAccountUsername}`;
  }
};

export const badgeInfoForIntegration = (
  integration: InternalIntegration,
  connections: (typeof Integration.$inferSelect)[],
): { badgeText: string; score: number } => {
  switch (integration.id) {
    case IntegrationIdentifier.GitLab:
    case IntegrationIdentifier.GitHub: {
      const stars = connections
        .map((c) => {
          return (c.providerInfo as { stars?: number }).stars;
        })
        .reduce((x, p) => (x !== undefined && p !== undefined ? x + p : undefined), 0);
      if (stars !== undefined) {
        return badgeInfoForProviderScore(integration.id, stars, 'star');
      }
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers: number }).followers;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f, 'follower');
    }
    case IntegrationIdentifier.StackExchange: {
      const r = connections
        .map((c) => {
          return (c.providerInfo as { reputation: number }[]).map((site) => site.reputation).reduce((x, p) => x + p, 0);
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, r);
    }
    case IntegrationIdentifier.X: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as TwitterUser).legacy.followers_count;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.WakaTime: {
      const seconds = connections
        .map((c) => {
          return (c.providerInfo as WakaTimeUser).total_seconds;
        })
        .reduce((p, x) => {
          if (x === undefined) {
            return p;
          }
          return x + (p ?? 0);
        }, undefined);
      if (seconds !== undefined) {
        return badgeInfoForProviderScore(integration.id, seconds);
      }
      return { badgeText: siWakatime.title, score: -0.01 };
    }
    case IntegrationIdentifier.LinkedIn: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { connectionsCount: number }).connectionsCount;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    /*
    case 'bitbucket':
      return badgeInfoForProviderScore(integration.id, -1);
    */
    case IntegrationIdentifier.Twitch: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers_count?: number }).followers_count ?? 0;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.ProductHunt: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers: number }).followers;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.YouTube: {
      const s = connections
        .map((c) => {
          return parseInt((c.providerInfo as YouTubeChannel).statistics.subscriberCount);
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, s);
    }
    case IntegrationIdentifier.Unsplash: {
      const followers = connections
        .map((c) => {
          return (c.providerInfo as UnsplashUser).followers_count;
        })
        .reduce((p, c) => c + p, 0);
      const downloads = connections
        .map((c) => {
          return (c.providerInfo as UnsplashUser).downloads;
        })
        .reduce((p, c) => c + p, 0);
      const best = followers > downloads ? followers : downloads;
      const suffix = followers > downloads ? 'follower' : 'download';
      return badgeInfoForProviderScore(integration.id, best, suffix);
    }
    case IntegrationIdentifier.Instagram: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as InstagramUser).follower_count ?? 0;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.Tiktok: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as TikTokUser).follower_count;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.YCombinator: {
      const karma = connections
        .map((c) => {
          return (c.providerInfo as YCombinatorUser).karma;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, karma);
    }
    case IntegrationIdentifier.Wikipedia: {
      const edits = connections
        .map((c) => {
          return (c.providerInfo as WikipediaUser).editcount;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, edits);
    }
    case IntegrationIdentifier.Reddit: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as RedditUser).total_karma;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.Patreon: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as PatreonUser).patron_count ?? 0;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.HackerNoon: {
      const f = connections
        .map((c) => {
          return (c.providerInfo as HackerNoonUser).profileStories?.reduce((t, s) => (s.reactionsCount ?? 0) + t, 0) ?? 0;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, f);
    }
    case IntegrationIdentifier.KoFi: {
      const followers = connections
        .map((c) => {
          return (c.providerInfo as KofiUser).followers;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.id, followers);
    }
  }
};

export const badgeInfoForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): { badgeText: string; score: number; scoreRaw: number; scoreText: string; suffixText: string } => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    case IntegrationIdentifier.GitHub:
    case IntegrationIdentifier.GitLab: {
      const stars = (providerInfo as { stars?: number }).stars;
      if (stars !== undefined) {
        return badgeInfoForProviderScore(provider, stars, 'star');
      }
      const f = (providerInfo as { followers: number }).followers;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.StackExchange: {
      const f = (providerInfo as { reputation: number }[]).map((c) => c.reputation).reduce((p, c) => p + c, 0);
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.X: {
      const f = (providerInfo as TwitterUser).legacy.followers_count;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.WakaTime: {
      const seconds = (providerInfo as WakaTimeUser).total_seconds;
      if (seconds !== undefined) {
        return badgeInfoForProviderScore(provider, seconds);
      }
      return { badgeText: '', score: -0.01, scoreRaw: -0.01, scoreText: '', suffixText: '' };
    }
    /*
    case 'bitbucket':
      return badgeInfoForProviderScore(provider, -2);
    */
    case IntegrationIdentifier.LinkedIn: {
      const f = (providerInfo as { connectionsCount: number }).connectionsCount;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.Twitch: {
      const f = (providerInfo as { followers_count?: number }).followers_count;
      if (f !== undefined) {
        return badgeInfoForProviderScore(provider, f);
      }
      return { badgeText: '', score: 0, scoreRaw: 0, scoreText: '', suffixText: '' };
    }
    case IntegrationIdentifier.ProductHunt: {
      const f = (providerInfo as { followers: number }).followers;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.YouTube: {
      const s = parseInt((providerInfo as YouTubeChannel).statistics.subscriberCount);
      return badgeInfoForProviderScore(provider, s);
    }
    case IntegrationIdentifier.Unsplash: {
      const followers = (providerInfo as UnsplashUser).followers_count;
      const downloads = (providerInfo as UnsplashUser).downloads;
      const best = followers > downloads ? followers : downloads;
      const suffix = followers > downloads ? 'follower' : 'download';
      return badgeInfoForProviderScore(provider, best, suffix);
    }
    case IntegrationIdentifier.Instagram: {
      const f = (providerInfo as InstagramUser).follower_count ?? 0;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.Tiktok: {
      const f = (providerInfo as TikTokUser).follower_count;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.YCombinator: {
      const f = (providerInfo as YCombinatorUser).karma;
      return badgeInfoForProviderScore(provider, f);
    }
    case IntegrationIdentifier.Wikipedia: {
      const edits = (providerInfo as WikipediaUser).editcount;
      return badgeInfoForProviderScore(provider, edits);
    }
    case IntegrationIdentifier.Reddit: {
      const karma = (providerInfo as RedditUser).total_karma;
      return badgeInfoForProviderScore(provider, karma);
    }
    case IntegrationIdentifier.Patreon: {
      const patrons = (providerInfo as PatreonUser).patron_count ?? 0;
      return badgeInfoForProviderScore(provider, patrons);
    }
    case IntegrationIdentifier.HackerNoon: {
      const reactions = (providerInfo as HackerNoonUser).profileStories?.reduce((t, s) => (s.reactionsCount ?? 0) + t, 0) ?? 0;
      return badgeInfoForProviderScore(provider, reactions);
    }
    case IntegrationIdentifier.KoFi: {
      const f = (providerInfo as KofiUser).followers;
      return badgeInfoForProviderScore(provider, f);
    }
  }
};

export const subConnectionsForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: IntegrationIdentifier,
): IntegrationSubConnection[] => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    //case 'bitbucket':
    case IntegrationIdentifier.GitHub:
    case IntegrationIdentifier.GitLab:
    case IntegrationIdentifier.X:
    case IntegrationIdentifier.WakaTime:
    case IntegrationIdentifier.LinkedIn:
    case IntegrationIdentifier.ProductHunt:
    case IntegrationIdentifier.Twitch:
    case IntegrationIdentifier.Unsplash:
    case IntegrationIdentifier.Instagram:
    case IntegrationIdentifier.Tiktok:
    case IntegrationIdentifier.YCombinator:
    case IntegrationIdentifier.Wikipedia:
    case IntegrationIdentifier.Reddit:
    case IntegrationIdentifier.Patreon:
    case IntegrationIdentifier.HackerNoon:
    case IntegrationIdentifier.KoFi:
    case IntegrationIdentifier.YouTube:
      return [];
    case IntegrationIdentifier.StackExchange: {
      return (providerInfo as StackExchangeUser[]).map((u) => {
        return {
          href: u.link,
          id: String(u.account_id),
          image: u.site?.icon_url,
          score: u.reputation,
          text: formatNumberWithSuffix(u.reputation, 'reputation', { plural: 'reputation' }),
          title: u.site?.name,
        };
      });
    }
  }
};

export const badgeInfoForProviderScore = (
  provider: IntegrationIdentifier,
  score: number,
  suffix?: string,
): { badgeText: string; score: number; scoreRaw: number; scoreText: string; suffixText: string } => {
  switch (provider) {
    case IntegrationIdentifier.GitHub:
    case IntegrationIdentifier.GitLab:
      return {
        badgeText: formatNumberWithSuffix(score, suffix ?? 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, suffix ?? 'follower'),
      };
    case IntegrationIdentifier.StackExchange: {
      return {
        badgeText: formatNumberWithSuffix(score, 'total reputation', { plural: 'total reputation' }),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'total reputation', { plural: 'total reputation' }),
      };
    }
    case IntegrationIdentifier.X: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case IntegrationIdentifier.WakaTime: {
      const seconds = score;
      const s = roundWithPrecision(seconds / 3600);
      if (seconds >= 60) {
        if (seconds >= 3600) {
          return {
            badgeText: formatNumberWithSuffix(seconds / 3600, 'hour'),
            score: s,
            scoreRaw: seconds,
            scoreText: formatNumber(seconds / 3600),
            suffixText: getSuffixForNumber(seconds / 3600, 'hour'),
          };
        }
        return {
          badgeText: formatNumberWithSuffix(seconds / 60, 'minute', { precision: 0 }),
          score: s,
          scoreRaw: seconds,
          scoreText: formatNumber(seconds / 60),
          suffixText: getSuffixForNumber(seconds / 60, 'minute'),
        };
      } else {
        return {
          badgeText: formatNumberWithSuffix(seconds, 'second', { precision: 0 }),
          score: s,
          scoreRaw: seconds,
          scoreText: formatNumber(seconds),
          suffixText: getSuffixForNumber(seconds, 'second'),
        };
      }
    }
    /*
    case 'bitbucket':
      return { badgeText: siBitbucket.title, score: -2, scoreText: '', suffixText: '' };
    */
    case IntegrationIdentifier.LinkedIn: {
      return {
        badgeText: formatNumberWithSuffix(score, 'connection'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'connection'),
      };
    }
    case IntegrationIdentifier.Twitch: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case IntegrationIdentifier.ProductHunt: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case IntegrationIdentifier.YouTube: {
      return {
        badgeText: formatNumberWithSuffix(score, 'subscriber'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'subscriber'),
      };
    }
    case IntegrationIdentifier.Unsplash: {
      return {
        badgeText: formatNumberWithSuffix(score, suffix ?? 'download'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, suffix ?? 'download'),
      };
    }
    case IntegrationIdentifier.Instagram: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case IntegrationIdentifier.Tiktok: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case IntegrationIdentifier.YCombinator: {
      return {
        badgeText: formatNumberWithSuffix(score, 'karma', { plural: 'karma' }),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'karma', { plural: 'karma' }),
      };
    }
    case IntegrationIdentifier.Wikipedia: {
      return {
        badgeText: formatNumberWithSuffix(score, 'edit'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'edit'),
      };
    }
    case IntegrationIdentifier.Reddit: {
      return {
        badgeText: formatNumberWithSuffix(score, 'karma', { plural: 'karma' }),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'karma', { plural: 'karma' }),
      };
    }
    case IntegrationIdentifier.Patreon: {
      return {
        badgeText: formatNumberWithSuffix(score, 'patron'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'patron'),
      };
    }
    case IntegrationIdentifier.HackerNoon: {
      return {
        badgeText: formatNumberWithSuffix(score, 'likes'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'likes'),
      };
    }
    case IntegrationIdentifier.KoFi: {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreRaw: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
  }
};
