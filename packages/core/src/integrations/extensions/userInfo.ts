import he from 'he';
import { parse } from 'node-html-parser';

import { USER_AGENT_CHROME } from '../../constants';
import { env } from '../../env';
import type {
  GetUserInfoHandler,
  HackerNoonProfileStory,
  HackerNoonUser,
  InstagramUser,
  KofiUser,
  PatreonUser,
  RedditUser,
  StackExchangeNetworkUser,
  StackExchangeSite,
  StackExchangeUser,
  TikTokUser,
  TwitterUser,
  UnsplashUser,
  WakaTimeUser,
  WikipediaUser,
  YCombinatorUser,
  YouTubeChannel,
} from '../../types';
import { wonderfulFetch } from '../helpers';
import { STACKEXCHANGE_SITES } from '../stackexchange-sites';

export const WakaTime: GetUserInfoHandler = async (_, token: string, opts) => {
  const resp = await wonderfulFetch('https://wakatime.com/api/v1/users/current', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const info = ((await resp.json()) as { data: WakaTimeUser }).data;

  // preserve info.total_seconds because it's populated separately in scrapeIntegrationWakaTime
  if (opts?.connection) {
    info.total_seconds = (opts.connection.providerInfo as WakaTimeUser).total_seconds;
  }

  const username = (info.username ? `@${info.username}` : info.full_name) ?? `${info.id}`;
  return { info: info, uid: info.id, username: username };
};

export const GitHub: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as { id: number; login: string };
  return { info: info, uid: String(info.id), username: info.login };
};

export const StackExchange: GetUserInfoHandler = async (_, token: string) => {
  const requestKey = env.INTEGRATION_STACK_EXCHANGE_SECRET_REQUEST_KEY;
  if (!requestKey) {
    return { error: 'Missing request key.' };
  }

  const allSites = new Map(
    (STACKEXCHANGE_SITES as StackExchangeSite[]).map<[string, StackExchangeSite]>((site) => {
      return [site.name, site];
    }),
  );

  const networkUsers: StackExchangeNetworkUser[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      access_token: token,
      key: requestKey,
      page: String(page),
      pagesize: '100',
      types: 'main_site',
    });
    const url = `https://api.stackexchange.com/2.3/me/associated?${params.toString()}`;
    const associated = await wonderfulFetch(url);
    if (associated.status >= 300) {
      return { error: `Unable to get user associations (${associated.status}): ${await associated.text()}` };
    }

    const { items, has_more } = (await associated.json()) as { has_more: boolean; items: StackExchangeNetworkUser[] };
    items.map((item) => {
      networkUsers.push(item);
    });

    if (items.length === 0 || !has_more) {
      break;
    }

    page++;
  }

  const responses = (
    await Promise.all(
      (
        await Promise.all(
          networkUsers.map(async (networkUser) => {
            const site = allSites.get(networkUser.site_name);
            if (!site) {
              return {};
            }
            const params = new URLSearchParams({
              access_token: token,
              key: requestKey,
              site: site.api_site_parameter,
            });
            const url = `https://api.stackexchange.com/2.3/me?${params.toString()}`;
            return {
              networkUser: networkUser,
              resp: await wonderfulFetch(url),
              site: site,
            };
          }),
        )
      )
        .filter(({ resp }) => {
          return resp?.status == 200;
        })
        .map(async ({ resp, site, networkUser }) => {
          const user = ((await resp?.json()) as { items: StackExchangeUser[] } | null)?.items[0];
          if (!user || !site) {
            return;
          }
          user.site = site;
          user.question_count = networkUser.question_count;
          user.answer_count = networkUser.answer_count;
          return user;
        }),
    )
  ).filter((user) => !!user);

  if (responses.length == 0) {
    return { error: 'No sites.' };
  }

  const user = responses.at(0);
  if (!user) {
    return { error: 'Missing site.' };
  }

  return { info: responses, uid: String(user.user_id), username: user.display_name };
};

export const GitLab: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://gitlab.com/api/v4/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `User response (${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as { followers: number; id: number; username: string };

  const followers = await wonderfulFetch(`https://gitlab.com/api/v4/users/${info.id}/followers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (followers.status !== 200) {
    return { error: `Followers response (${resp.status}): ${await resp.text()}` };
  }

  const count = parseInt(followers.headers.get('X-Total') ?? '');
  info.followers = count;

  return { info: info, uid: String(info.id), username: info.username };
};

export const Twitter: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Enter your username.' };
  }

  const params = new URLSearchParams({
    token,
  });

  const resp = await wonderfulFetch(
    `https://wakatime.com/api/v1/wonderful.dev/integrations/x/profile/${opts.manualData.username}?${params.toString()}`,
  );
  if (resp.status !== 200) {
    // return { error: `(${resp.status}): ${await resp.text()}` };
    return { error: 'Twitter is rate limiting us, please click Verify again in a few seconds.' };
  }

  const info = (await resp.json()) as TwitterUser;
  if (!info.rest_id) {
    return { error: 'Twitter is rate limiting us, please click Verify again in a few seconds.' };
  }

  // make sure bio has secret token for this user
  if (!info.legacy.description?.includes(token)) {
    return { error: 'We didn’t find the verification code in your X bio.' };
  }

  return {
    info,
    uid: String(info.rest_id),
    username: info.legacy.screen_name,
  };
};

export const Linkedin: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `Userinfo response (${resp.status}): ${await resp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2?context=linkedin%2Fconsumer%2Fcontext#api-request-to-retreive-member-details
  const userInfo = (await resp.json()) as {
    email: string;
    email_verified: boolean;
    locale: string;
    name: string;
    picture: string;
    sub: string;
  };

  const meResp = await wonderfulFetch('https://api.linkedin.com/v2/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (meResp.status !== 200) {
    return { error: `Me response (${meResp.status}): ${await meResp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fconsumer%2Fcontext#sample-response
  const me = (await meResp.json()) as {
    id: string;
    localizedFirstName: string;
    localizedHeadline: string;
    localizedLastName: string;
    picture: string;
    vanityName: string;
  };

  const connectionsResp = await wonderfulFetch(`https://api.linkedin.com/v2/connections/urn:li:person:${me.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (connectionsResp.status !== 200) {
    return { error: `Connections response (${connectionsResp.status}): ${await connectionsResp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fconsumer%2Fcontext#sample-response
  const connections = (
    (await connectionsResp.json()) as {
      firstDegreeSize: number;
    }
  ).firstDegreeSize;

  return { info: { connectionsCount: connections, me, userInfo }, uid: me.id, username: me.vanityName };
};

export const Twitch: GetUserInfoHandler = async (integration, token: string) => {
  if (!integration) {
    return { error: 'Missing integration.' };
  }
  // eslint-disable-next-line no-restricted-properties
  const clientId = process.env[`INTEGRATION_${integration.id.toUpperCase()}_CLIENT_ID`] ?? integration.clientId;

  const resp = await wonderfulFetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  // https://dev.twitch.tv/docs/api/reference/#get-users
  const user = (
    (await resp.json()) as {
      data: {
        broadcaster_type: string;
        created_at: string;
        description: string;
        display_name: string;
        id: string;
        login: string;
        profile_image_url: string;
        type: string;
      }[];
    }
  ).data[0];

  if (!user) {
    throw new Error('Twitch user not found!');
  }

  // https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions
  const sResp = await wonderfulFetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}&first=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (sResp.status !== 200) {
    return { error: `Subscribers response (${resp.status}): ${await resp.text()}` };
  }
  const subscribers_count = ((await sResp.json()) as { total: number }).total;

  // https://dev.twitch.tv/docs/api/reference/#get-channel-followers
  const fResp = await wonderfulFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}&first=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (fResp.status !== 200) {
    return { error: `Followers response (${resp.status}): ${await resp.text()}` };
  }
  const followers_count = ((await fResp.json()) as { total: number }).total;

  const info = { followers_count, subscribers_count, ...user };
  return { info, uid: user.id, username: user.login };
};

export const ProductHunt: GetUserInfoHandler = async (integration, token) => {
  const resp = await wonderfulFetch('https://api.producthunt.com/v2/api/graphql', {
    body: JSON.stringify({
      query: 'query { viewer { user { id name username createdAt profileImage twitterUsername websiteUrl } } }',
    }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
  });
  if (resp.status !== 200) {
    return { error: `User response (${resp.status}): ${await resp.text()}` };
  }

  // http://api-v2-docs.producthunt.com.s3-website-us-east-1.amazonaws.com/object/viewer/
  const user = (
    (await resp.json()) as {
      data: {
        viewer: {
          user: {
            createdAt: string;
            id: string;
            name: string;
            profileImage: string;
            twitterUsername?: string;
            username: string;
            websiteUrl: string | null;
          };
        };
      };
    }
  ).data.viewer.user;

  const profileResp = await wonderfulFetch(`https://producthunt.com/@${user.username}`, {
    headers: {
      'User-Agent': USER_AGENT_CHROME,
    },
  });
  if (profileResp.status !== 200) {
    return { error: `Profile response (${profileResp.status}): ${await profileResp.text()}` };
  }

  const root = parse(await profileResp.text());
  const followersLink = root.querySelector(`a[href="/@${encodeURIComponent(user.username)}/followers"]`);
  const followers = parseInt(((followersLink?.innerText.match(/([\d,]+) follower/) ?? undefined)?.[1] ?? '-1').replaceAll(',', ''));
  if (followers < 0) {
    return { error: `Profile html response unable to parse followers ${profileResp.status}: ${root.outerHTML}` };
  }

  return { info: { followers, user }, uid: user.id, username: user.username };
};

export const Unsplash: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.unsplash.com/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const me = (await resp.json()) as UnsplashUser;

  return {
    info: me,
    uid: me.id,
    username: me.username,
  };
};

export const TikTok: GetUserInfoHandler = async (integration, token: string) => {
  const fields = [
    'open_id',
    'union_id',
    'video_count',
    'likes_count',
    'following_count',
    'follower_count',
    'is_verified',
    'profile_deep_link',
    'bio_description',
    'display_name',
    'avatar_large_url',
    'avatar_url_100',
    'avatar_url',
  ].join(',');
  const resp = await wonderfulFetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const user = ((await resp.json()) as { data: { user?: TikTokUser } }).data.user;
  if (!user) {
    return { error: 'Missing user.' };
  }

  return {
    info: user,
    uid: user.union_id,
    username: user.display_name,
  };
};

export const YCombinator: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Enter your username.' };
  }

  const resp = await wonderfulFetch(`https://hacker-news.firebaseio.com/v0/user/${opts.manualData.username}.json`);
  if (resp.status !== 200) {
    // return { error: `(${resp.status}): ${await resp.text()}` };
    return { error: `HN API responded with ${resp.status}.` };
  }

  // https://github.com/HackerNews/API?tab=readme-ov-file#users
  const info = (await resp.json()) as YCombinatorUser;
  info.about = he.decode(info.about ?? '');

  // make sure YC bio has secret token for this user
  if (!info.about.includes(token)) {
    // retry using real YC profile url because API updates slowly
    const resp = await wonderfulFetch(`https://news.ycombinator.com/user?id=${opts.manualData.username}`);
    if (resp.status !== 200) {
      // return { error: `Profile response (${resp.status}): ${await resp.text()}` };
      return { error: `HN Profile response ${resp.status}.` };
    }

    const text = await resp.text();
    if (!text.includes(token)) {
      return { error: 'We didn’t find the verification code in your HN bio.' };
    }
  }

  return {
    info,
    uid: info.id,
    username: info.id,
  };
};

export const KoFi: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Enter your username.' };
  }

  const resp = await wonderfulFetch(`https://ko-fi.com/${opts.manualData.username}`);
  if (resp.status !== 200) {
    // return { error: `(${resp.status}): ${await resp.text()}` };
    return { error: `Ko-fi profile response ${resp.status}.` };
  }

  const html = await resp.text();
  const id = html.split('data-page-id="')[1]?.split('"')[0];
  if (!id) {
    return { error: 'Unable to parse user id from Ko-fi profile.' };
  }

  const root = parse(html);
  const profileHeader = root.querySelector('#profile-header-v2');
  if (!profileHeader) {
    return { error: 'Unable to find profile header.' };
  }
  const followersText = profileHeader.querySelector('.kfds-c-profile-link-handle')?.innerText;
  const followers = parseInt(((followersText?.trim().match(/([\d,]+) followers?/i) ?? undefined)?.[1] ?? '0').replaceAll(',', ''));

  const about = he
    .decode(root.querySelector('div[name="About Section"]')?.querySelector('p')?.innerText.trim() ?? '')
    .trim()
    .replaceAll(token, '')
    .trim();
  const avatarUrl = profileHeader.querySelector('#profilePicture')?.getAttribute('src');
  const name = profileHeader.querySelector('.kfds-font-size-22.kfds-font-bold')?.querySelector('span')?.innerText;

  const info = {
    id,
    username: opts.manualData.username,
    followers,
    about,
    name,
    avatarUrl,
  } as KofiUser;

  // make sure bio has secret token for this user
  if (!html.includes(token)) {
    return { error: 'We didn’t find the verification code in your Ko-fi bio.' };
  }

  return {
    info,
    uid: info.id,
    username: info.username,
  };
};

export const HackerNoon: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Enter your username.' };
  }

  const resp = await wonderfulFetch(`https://hackernoon.com/u/${opts.manualData.username}`, {
    headers: {
      'User-Agent': USER_AGENT_CHROME,
    },
  });
  if (resp.status !== 200) {
    // return { error: `HackerNoon profile response (${resp.status}): ${await resp.text()}` };
    return { error: `HackerNoon profile response ${resp.status}.` };
  }

  const root = parse(await resp.text());
  const nextData = root.querySelector('script#__NEXT_DATA__');
  const data = (
    JSON.parse(nextData?.innerText ?? '{}') as {
      props?: { pageProps?: { data?: { profile?: HackerNoonUser; profileStories?: HackerNoonProfileStory[] } } };
    }
  ).props?.pageProps?.data;

  const info = data?.profile ?? ({} as HackerNoonUser);
  info.profileStories = data?.profileStories;

  // make sure bio has secret token for this user
  if (!info.bio?.includes(token)) {
    return { error: 'We didn’t find the verification code in your HackerNoon bio.' };
  }

  return {
    info,
    uid: info.id,
    username: info.handle,
  };
};

export const Wikipedia: GetUserInfoHandler = async (integration, token: string) => {
  const resp = await wonderfulFetch('https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  // https://www.mediawiki.org/wiki/OAuth/For_Developers#Identifying_the_user_2
  const user = (await resp.json()) as WikipediaUser;
  if (!user.username) {
    return { error: 'Missing username.' };
  }

  const htmlResp = await wonderfulFetch(`https://en.wikipedia.org/wiki/Special:CentralAuth/${user.username}`, { isJson: false });
  if (htmlResp.status !== 200) {
    return { error: `central auth response (${htmlResp.status}): ${await htmlResp.text()}` };
  }
  const root = parse(await htmlResp.text());
  const items = root.querySelectorAll('#mw-centralauth-info ul li');
  const editItem = items.find((item) => item.querySelector('strong')?.rawText.trim() == 'Total edit count:')?.rawText;
  if (!editItem?.trim().startsWith('Total edit count:')) {
    return { error: `${integration?.name} central auth response unable to parse total edit count: ${root.innerHTML}` };
  }

  // replace incorrect profile edit count with total edit count across all wikis
  const editCount = parseInt(editItem.replace('Total edit count:', '').trim());
  user.editcount = editCount;

  return {
    info: user,
    uid: String(user.sub),
    username: user.username,
  };
};

export const Reddit: GetUserInfoHandler = async (integration, token) => {
  const resp = await wonderfulFetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as RedditUser;
  info.icon_img = info.icon_img.split('?')[0] ?? '';

  return { info: info, uid: info.id, username: info.name };
};

export const Patreon: GetUserInfoHandler = async (integration, token) => {
  const params = new URLSearchParams({
    'fields[user]': 'about,created,email,first_name,full_name,image_url,is_email_verified,last_name,social_connections,url,vanity',
  });
  const resp = await wonderfulFetch(`https://www.patreon.com/api/oauth2/v2/identity?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = ((await resp.json()) as { data: { attributes: PatreonUser; id: string } }).data;
  const user = info.attributes;
  user.id = info.id;

  const campaignsParams = new URLSearchParams({
    'fields[campaign]': 'patron_count',
  });
  const campaignsResp = await wonderfulFetch(`https://www.patreon.com/api/oauth2/v2/campaigns?${campaignsParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (campaignsResp.status !== 200) {
    return { error: `(${campaignsResp.status}): ${await campaignsResp.text()}` };
  }
  const patrons = ((await campaignsResp.json()) as { data: { attributes: { patron_count: number } }[] }).data
    .map((campaign) => campaign.attributes.patron_count)
    .reduce((p, c) => p + c, 0);
  user.patron_count = patrons;

  return { info: user, uid: info.id, username: user.vanity ?? info.id };
};

export const Instagram: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Enter your username.' };
  }

  const resp = await wonderfulFetch(`https://wakatime.com/api/v1/wonderful.dev/integrations/instagram/profile/${opts.manualData.username}`);
  if (resp.status === 404) {
    return { error: `Unable to find Instagram user: ${opts.manualData.username}` };
  }

  if (resp.status !== 200) {
    // return { error: `(${resp.status}): ${await resp.text()}` };
    return { error: `Instagram profile response ${resp.status}.` };
  }

  const info = (await resp.json()) as InstagramUser;
  if (!info.id) {
    return { error: `Unable to find user id for: ${opts.manualData.username}` };
  }

  // make sure bio has secret token for this user
  if (!info.biography?.includes(token)) {
    return { error: 'We didn’t find the verification code in your Instagram bio.' };
  }

  return {
    info,
    uid: info.id,
    username: info.username,
  };
};

export const YouTube: GetUserInfoHandler = async (_, token: string, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Missing channel username or handle.' };
  }

  // eslint-disable-next-line no-restricted-properties, @typescript-eslint/no-non-null-assertion
  const secret = process.env.INTEGRATION_YOUTUBE_SECRET!;

  const params = new URLSearchParams({
    key: secret,
    part: 'id,snippet,topicDetails,brandingSettings,status,statistics',
    forHandle: opts.manualData.username,
  });
  const url = `https://youtube.googleapis.com/youtube/v3/channels?${params.toString()}`;

  const resp = await wonderfulFetch(url);
  if (resp.status !== 200) {
    // return { error: `Channel response (${resp.status}): ${await resp.text()}` };
    return { error: `YouTube responded with ${resp.status}` };
  }

  const info = ((await resp.json()) as { items: YouTubeChannel[] }).items[0];
  if (!info) {
    return { error: `YouTube channel not found (${resp.status})` };
  }

  // make sure bio has secret token for this user
  if (!info.snippet.description.includes(token)) {
    return { error: 'We didn’t find the verification code in your YouTube about bio.' };
  }

  return {
    info,
    uid: info.id,
    username: info.snippet.customUrl ?? opts.manualData.username,
  };
};
