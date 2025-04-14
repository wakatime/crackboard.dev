import { IntegrationIdentifier } from '@acme/db/schema';
import {
  siGithub,
  siGitlab,
  siHackernoon,
  siInstagram,
  siKofi,
  siPatreon,
  siProducthunt,
  siReddit,
  siStackexchange,
  siTiktok,
  siTwitch,
  siUnsplash,
  siWakatime,
  siWikipedia,
  siYcombinator,
  siYoutube,
} from 'simple-icons';

import type { InternalIntegration } from '../types';
import { GitHubRevoke, StackExchangeRevoke, TikTokRevoke, TwitchRevoke } from './extensions/revoke';
import {
  LinkedinAccessTokenHandler,
  RedditAccessTokenHandler,
  TikTokAccessTokenHandler,
  TwitterAccessTokenHandler,
  YouTubeAccessTokenHandler,
} from './extensions/token';
import { TikTokAuthorizeUrlBuilder, TwitterAuthorizeUrlBuilder } from './extensions/urlBuilders';
import {
  GitHub,
  GitLab,
  HackerNoon,
  Instagram,
  KoFi,
  Linkedin,
  Patreon,
  ProductHunt,
  Reddit,
  StackExchange,
  TikTok,
  Twitch,
  Twitter,
  Unsplash,
  WakaTime,
  Wikipedia,
  YCombinator,
  YouTube,
} from './extensions/userInfo';

export const getTitleForProvider = (provider: IntegrationIdentifier): string => {
  switch (provider) {
    case IntegrationIdentifier.GitHub:
      return siGithub.title;
    case IntegrationIdentifier.WakaTime:
      return siWakatime.title;
    case IntegrationIdentifier.StackExchange:
      return siStackexchange.title;
    case IntegrationIdentifier.Twitch:
      return siTwitch.title;
    case IntegrationIdentifier.GitLab:
      return siGitlab.title;
    case IntegrationIdentifier.HackerNoon:
      return siHackernoon.title;
    case IntegrationIdentifier.Instagram:
      return siInstagram.title;
    case IntegrationIdentifier.LinkedIn:
      return 'Linkedin';
    case IntegrationIdentifier.Patreon:
      return siPatreon.title;
    case IntegrationIdentifier.ProductHunt:
      return siProducthunt.title;
    case IntegrationIdentifier.Reddit:
      return siReddit.title;
    case IntegrationIdentifier.Tiktok:
      return siTiktok.title;
    case IntegrationIdentifier.X:
      return 'X';
    case IntegrationIdentifier.Unsplash:
      return siUnsplash.title;
    case IntegrationIdentifier.Wikipedia:
      return siWikipedia.title;
    case IntegrationIdentifier.YCombinator:
      return 'Hacker News';
    case IntegrationIdentifier.YouTube:
      return siYoutube.title;
    case IntegrationIdentifier.KoFi:
      return siKofi.title;
  }
};

export const integrations: InternalIntegration[] = [
  //{ name: siBitbucket.title, icon: siBitbucket.svg },
  //{ name: 'crates.io' },
  {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    clientId: 'Iv1.9354d99738134238',
    description: 'Your public GitHub repos and public events are used to build your profile and show your language milestones.',
    extraAppInfo: { appId: '393009' },
    icon: siGithub.svg,
    id: IntegrationIdentifier.GitHub,
    name: getTitleForProvider(IntegrationIdentifier.GitHub),
    postInstallUrl: 'https://github.com/apps/wonderful-dev/installations/new',
    revokeHandler: GitHubRevoke,
    scopes: {
      default: 'user',
    },
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoHandler: GitHub,
    website: 'https://github.com/',
  },
  {
    authorizeUrl: 'https://gitlab.com/oauth/authorize',
    clientId: '4fae7ab51cf04d6ef527dcd85ef7b774a91cb172abd2d9330ec219ca9efb8539',
    description: 'Your public GitLab repos and public events are used to build your profile and show your language milestones.',
    icon: siGitlab.svg,
    id: IntegrationIdentifier.GitLab,
    name: getTitleForProvider(IntegrationIdentifier.GitLab),
    revokeUrl: 'https://gitlab.com/oauth/revoke',
    scopes: {
      default: 'read_user read_repository read_api',
    },
    tokenUrl: 'https://gitlab.com/oauth/token',
    userInfoHandler: GitLab,
    website: 'https://gitlab.com/',
  },
  //{ name: siLeetcode.title, icon: siLeetcode.svg },
  //{ name: siNpm.title, icon: siNpm.svg },
  //{ name: siPypi.title, icon: siPypi.svg },
  {
    accessTokenHandler: RedditAccessTokenHandler,
    authorizeUrl: 'https://www.reddit.com/api/v1/authorize',
    clientId: '3tWtKxxwwr3no3II8Ucfhw',
    description: 'Your Reddit karma is displayed on your profile.',
    icon: siReddit.svg,
    id: IntegrationIdentifier.Reddit,
    name: getTitleForProvider(IntegrationIdentifier.Reddit),
    revokeUrl: 'https://www.reddit.com/api/v1/revoke',
    scopes: {
      default: 'identity',
    },
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    userInfoHandler: Reddit,
    website: 'https://www.reddit.com/',
  },
  {
    authorizeUrl: 'https://stackoverflow.com/oauth',
    clientId: '27244',
    description: 'Your StackOverflow questions and answers are displayed on your timeline.',
    icon: siStackexchange.svg,
    id: IntegrationIdentifier.StackExchange,
    name: getTitleForProvider(IntegrationIdentifier.StackExchange),
    revokeHandler: StackExchangeRevoke,
    scopes: {
      default: 'no_expiry',
    },
    tokenUrl: 'https://stackoverflow.com/oauth/access_token',
    userInfoHandler: StackExchange,
    website: 'https://stackoverflow.com/',
  },
  //{ name: siTopcoder.title, icon: siTopcoder.svg },
  {
    accessTokenHandler: LinkedinAccessTokenHandler,
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: '77wu3767fltdhf',
    description: 'Your LinkedIn follower count is displayed on your profile.',
    icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    id: IntegrationIdentifier.LinkedIn,
    name: getTitleForProvider(IntegrationIdentifier.LinkedIn),
    revokeUrl: 'https://www.linkedin.com/oauth/v2/revoke',
    scopes: {
      default: 'openid profile email r_basicprofile r_1st_connections_size',
    },
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoHandler: Linkedin,
    website: 'https://www.linkedin.com/',
  },
  {
    accessTokenHandler: TwitterAccessTokenHandler,
    authorizeUrl: 'https://x.com/i/oauth2/authorize',
    authorizeUrlBuilder: TwitterAuthorizeUrlBuilder,
    clientId: 'ZXd0NXpCUzl4dGlQTUU3bjllZ3Q6MTpjaQ',
    description: 'Your X follower count is displayed on your profile.',
    icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    id: IntegrationIdentifier.X,
    isManualValidation: true,
    name: getTitleForProvider(IntegrationIdentifier.X),
    scopes: {
      default: 'users.read offline.access tweet.read',
    },
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    userInfoHandler: Twitter,
    website: 'https://x.com/',
  },
  {
    authorizeUrl: 'https://wakatime.com/oauth/authorize',
    clientId: 'oCQfP6NKBztpG41fzvT2KGCl',
    description: 'Your WakaTime languages and total code time are displayed on your profile.',
    icon: siWakatime.svg,
    id: IntegrationIdentifier.WakaTime,
    name: getTitleForProvider(IntegrationIdentifier.WakaTime),
    needsScrapeForUserInfo: true,
    revokeUrl: 'https://wakatime.com/oauth/revoke',
    scopes: {
      default: [
        'read_summaries.categories',
        'read_summaries.dependencies',
        'read_summaries.editors',
        'read_summaries.languages',
        'read_summaries.operating_systems',
      ].join(','),
    },
    tokenUrl: 'https://wakatime.com/oauth/token',
    userInfoHandler: WakaTime,
    website: 'https://wakatime.com/',
  },
  //{ name: 'Wellfound', icon: siAngellist.svg },
  //{ name: siYoutube.title, icon: siYoutube.svg },
  {
    authorizeUrl: 'https://id.twitch.tv/oauth2/authorize',
    clientId: '0ew7rcv2veyb1ufo6mlui2xk68zwbx',
    description: 'Your Twitch follower count is displayed on your profile.',
    icon: siTwitch.svg,
    id: IntegrationIdentifier.Twitch,
    name: getTitleForProvider(IntegrationIdentifier.Twitch),
    revokeHandler: TwitchRevoke,
    scopes: {
      default: 'channel:read:subscriptions moderator:read:followers',
    },
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    userInfoHandler: Twitch,
    website: 'https://twitch.tv/',
  },
  {
    authorizeUrl: 'https://api.producthunt.com/v2/oauth/authorize',
    clientId: '8OiEzwo6HB3c5yyFQSbTfIBtYhzi17fQKLG2KnHMVns',
    description:
      'Your ProductHunt follower count is displayed on your profile, and your noteworthy launches are displayed on your timeline.',
    icon: siProducthunt.svg,
    id: IntegrationIdentifier.ProductHunt,
    name: getTitleForProvider(IntegrationIdentifier.ProductHunt),
    needsScrapeForUserInfo: true,
    scopes: {
      default: 'private public',
    },
    tokenUrl: 'https://api.producthunt.com/v2/oauth/token',
    userInfoHandler: ProductHunt,
    website: 'https://producthunt.com/',
  },
  {
    accessTokenHandler: YouTubeAccessTokenHandler,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: '761858231574-sscl99mebd9445pbj8vll3d1teh24tcc.apps.googleusercontent.com',
    description: 'Your YouTube subscriber count is displayed on your profile.',
    isManualValidation: true,
    icon: siYoutube.svg,
    id: IntegrationIdentifier.YouTube,
    name: getTitleForProvider(IntegrationIdentifier.YouTube),
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: {
      default:
        'https://www.googleapis.com/auth/youtube.readonly openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    },
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoHandler: YouTube,
    website: 'https://youtube.com/',
  },
  {
    authorizeUrl: 'https://unsplash.com/oauth/authorize',
    clientId: '515msnrLgSbS8IEacj-QQQu-GMe3yR8ZBs4_re06t3M',
    description: 'Your Unsplash download count is displayed on your profile.',
    icon: siUnsplash.svg,
    id: IntegrationIdentifier.Unsplash,
    name: getTitleForProvider(IntegrationIdentifier.Unsplash),
    revokeUrl: 'https://unsplash.com/oauth/revoke',
    scopes: {
      default: 'public',
    },
    tokenUrl: 'https://unsplash.com/oauth/token',
    userInfoHandler: Unsplash,
    website: 'https://unsplash.com/',
  },
  {
    authorizeUrl: 'https://api.instagram.com/oauth/authorize',
    clientId: '6453722464729305',
    description: 'Your Instagram follower count is displayed on your profile.',
    icon: siInstagram.svg,
    id: IntegrationIdentifier.Instagram,
    isManualValidation: true,
    name: getTitleForProvider(IntegrationIdentifier.Instagram),
    revokeUrl: '',
    scopes: {
      default: 'user_profile',
    },
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoHandler: Instagram,
    website: 'https://instagram.com/',
  },
  {
    accessTokenHandler: TikTokAccessTokenHandler,
    authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize',
    authorizeUrlBuilder: TikTokAuthorizeUrlBuilder,
    clientId: 'awwurdhrog3x87dy',
    description: 'Your TikTok follower count is displayed on your profile.',
    icon: siTiktok.svg,
    id: IntegrationIdentifier.Tiktok,
    name: getTitleForProvider(IntegrationIdentifier.Tiktok),
    revokeHandler: TikTokRevoke,
    revokeUrl: 'https://open.tiktokapis.com/v2/oauth/revoke/',
    scopes: {
      default: 'user.info.basic',
    },
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    userInfoHandler: TikTok,
    website: 'https://www.tiktok.com/',
  },
  /*
  Snapchat doesn't show follower counts, even in their app. There's no reason to support Snapchat at this time.
  {
    authorizeUrl: 'https://accounts.snapchat.com/accounts/oauth2/auth',
    clientId: '',
    description: 'Your Snapchat follower count is displayed on your profile.',
    icon: siSnapchat.svg,
    isAwaitingVerification: true,
    id: IntegrationIdentifier.Snapchat,
    name: getTitleForProvider(IntegrationIdentifier.Snapchat),
    revokeUrl: 'https://accounts.snapchat.com/accounts/oauth2/revoke',
    scopes: {
      default: ' '.join(['user.display_name', 'user.bitmoji.avatar', 'user.external_id']),
    },
    tokenUrl: 'https://accounts.snapchat.com/accounts/oauth2/token',
    website: 'https://snapchat.com/',
  },
  */
  {
    authorizeUrl: '',
    clientId: '',
    description:
      'Your HackerNews karma is displayed on your profile, and your noteworthy HackerNews posts or comments are displayed on your timeline.',
    icon: siYcombinator.svg,
    id: IntegrationIdentifier.YCombinator,
    isManualValidation: true,
    name: getTitleForProvider(IntegrationIdentifier.YCombinator),
    scopes: {
      default: '',
    },
    tokenUrl: '',
    userInfoHandler: YCombinator,
    website: 'https://news.ycombinator.com/',
  },
  {
    authorizeUrl: '',
    clientId: '',
    description: 'The total number of people who liked your HackerNoon writings is displayed on your profile.',
    icon: siHackernoon.svg,
    id: IntegrationIdentifier.HackerNoon,
    isManualValidation: true,
    name: getTitleForProvider(IntegrationIdentifier.HackerNoon),
    scopes: {
      default: '',
    },
    tokenUrl: '',
    userInfoHandler: HackerNoon,
    website: 'https://hackernoon.com/',
  },
  {
    authorizeUrl: 'https://meta.wikimedia.org/w/rest.php/oauth2/authorize',
    clientId: 'a5d10a5fe16f3c9933b38d98952ba75b',
    description: 'Your Wikipedia edit count is displayed on your profile.',
    icon: siWikipedia.svg,
    id: IntegrationIdentifier.Wikipedia,
    name: getTitleForProvider(IntegrationIdentifier.Wikipedia),
    revokeUrl: 'https://meta.wikimedia.org/w/rest.php/oauth2/revoke',
    scopes: {
      default: '',
    },
    tokenUrl: 'https://meta.wikimedia.org/w/rest.php/oauth2/access_token',
    userInfoHandler: Wikipedia,
    website: 'https://wikipedia.org/',
  },
  {
    accessTokenHandler: RedditAccessTokenHandler,
    authorizeUrl: 'https://www.patreon.com/oauth2/authorize',
    clientId: '04n8h9Bn3NXqVkyrd1LEpOh7WgmHaFmKyoGBohsIvdSNu-U7oiPGUrecNtIoDimV',
    description: 'Your patron count is displayed on your profile.',
    icon: siPatreon.svg,
    id: IntegrationIdentifier.Patreon,
    name: getTitleForProvider(IntegrationIdentifier.Patreon),
    revokeUrl: 'https://www.patreon.com/oauth2/revoke',
    scopes: {
      default: 'identity',
    },
    tokenUrl: 'https://www.patreon.com/api/oauth2/token',
    userInfoHandler: Patreon,
    website: 'https://www.patreon.com/',
  },
  {
    authorizeUrl: '',
    clientId: '',
    description: 'Your Ko-fi follower count is displayed on your profile.',
    icon: siKofi.svg,
    id: IntegrationIdentifier.KoFi,
    isManualValidation: true,
    name: getTitleForProvider(IntegrationIdentifier.KoFi),
    scopes: {
      default: '',
    },
    tokenUrl: '',
    userInfoHandler: KoFi,
    website: 'https://ko-fi.com/',
  },
];
