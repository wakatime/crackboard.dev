import type { Integration } from '@acme/db/schema';

import { env } from '../../env';
import type { RevokeTokenHandler } from '../../types';
import { gitHubAppRequest, wonderfulFetch } from '../helpers';
import { integrations } from '../integration-list';

export const GitHubRevoke: RevokeTokenHandler = async (integration: typeof Integration.$inferSelect, token: string): Promise<boolean> => {
  // revoke GitHub App installation
  const iResp = await wonderfulFetch('https://api.github.com/user/installations?per_page=100', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`,
    },
  });
  if (iResp.status >= 300) {
    console.error(`${integration.providerAccountUsername}: Unable to get ${integration.provider} app install: ${iResp.status}`);
    console.error(await iResp.text());
    return false;
  } else {
    const installations = (await iResp.json()) as { installations: { id: number }[] };
    await Promise.all(
      installations.installations.map(async (install) => {
        return await gitHubAppRequest(integration, 'DELETE', `https://api.github.com/app/installations/${install.id}`);
      }),
    );
  }

  // revoke GitHub OAuth access_token
  const integrationConfig = integrations.find((i) => {
    return i.id === integration.provider;
  });
  if (!integrationConfig) {
    return false;
  }
  const secret = env.INTEGRATION_GITHUB_SECRET;
  if (!secret) {
    return false;
  }
  const auth = Buffer.from(`${integrationConfig.clientId}:${secret}`).toString('base64');
  const resp = await wonderfulFetch(`https://api.github.com/applications/${integrationConfig.clientId}/grant`, {
    body: JSON.stringify({ access_token: token }),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Basic ${auth}`,
    },
    method: 'DELETE',
  });
  if (resp.status >= 300) {
    console.error(`${integration.providerAccountUsername}: Unable to revoke ${integration.provider} token: ${resp.status}`);
    console.error(await resp.text());
    return false;
  }
  return true;
};

export const StackExchangeRevoke: RevokeTokenHandler = async (
  integration: typeof Integration.$inferSelect,
  token: string,
): Promise<boolean> => {
  const url = `https://api.stackexchange.com/2.3/access-tokens/${token}/invalidate`;
  const resp = await wonderfulFetch(url);
  if (resp.status >= 300) {
    console.error(`${integration.providerAccountUsername}: Unable to revoke ${integration.provider} access token: ${resp.status}`);
    console.error(await resp.text());
    return false;
  }
  return true;
};

export const TwitchRevoke: RevokeTokenHandler = async (integration: typeof Integration.$inferSelect, token: string): Promise<boolean> => {
  const url = 'https://id.twitch.tv/oauth2/revoke';
  const integrationConfig = integrations.find((i) => {
    return i.id === integration.provider;
  });
  if (!integrationConfig) {
    return false;
  }
  const client_id = env.INTEGRATION_TWITCH_CLIENT_ID ?? integrationConfig.clientId;
  const resp = await wonderfulFetch(`${url}?client_id=${client_id}&token=${token}`, {
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
    },
    method: 'POST',
  });
  if (resp.status >= 300) {
    console.error(`${integration.providerAccountUsername}: Unable to revoke ${integration.provider} token: ${resp.status}`);
    console.error(await resp.text());
    return false;
  }
  return true;
};

export const TikTokRevoke: RevokeTokenHandler = async (integration: typeof Integration.$inferSelect, token: string): Promise<boolean> => {
  const integrationConfig = integrations.find((i) => {
    return i.id === integration.provider;
  });
  if (!integrationConfig) {
    return false;
  }
  const secret = env.INTEGRATION_TIKTOK_SECRET;
  if (!secret) {
    return false;
  }
  const url = integrationConfig.revokeUrl;
  if (!url) {
    return false;
  }
  const client_id = env.INTEGRATION_TIKTOK_CLIENT_ID ?? integrationConfig.clientId;
  const body = new URLSearchParams({
    client_key: client_id,
    client_secret: secret,
    token: token,
  }).toString();
  const resp = await wonderfulFetch(url, {
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
  if (resp.status >= 300) {
    console.error(`${integration.providerAccountUsername}: Unable to revoke ${integration.provider} token: ${resp.status}`);
    console.error(await resp.text());
    return false;
  }
  return true;
};
