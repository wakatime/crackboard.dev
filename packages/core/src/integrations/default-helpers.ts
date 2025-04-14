import { IntegrationIdentifier } from '@acme/db/schema';

import type { AccessTokenHandler, InternalIntegration, OAuthResponse, OAuthToken, RefreshTokenHandler } from '../types';
import { parseJSONObject } from '../validators';
import { getExpiresAt, getRedirectUri, wonderfulFetch } from './helpers';

export const revokeAccessToken = async (token: string): Promise<void> => {
  // overwrite integration configs in DEV using .env file

  const client_id = WAKATIME_APP_ID;
  // eslint-disable-next-line no-restricted-properties
  const secret = process.env[`INTEGRATION_${connection.provider.toUpperCase()}_SECRET`];
  if (!secret) {
    return;
  }

  const body = new FormData();
  body.append('client_id', client_id);
  body.append('client_secret', secret);
  body.append('access_token', token);
  const resp = await wonderfulFetch(integrationConfig.revokeUrl, {
    body: body,
    headers: {
      Accept: 'application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  // try revoking with JSON payload if form submit fails, or if it's GitLab because they always return 200 status
  if (resp.status >= 300 || connection.provider == IntegrationIdentifier.GitLab) {
    const auth = Buffer.from(`${integrationConfig.clientId}:${secret}`).toString('base64');
    const secondResp = await wonderfulFetch(integrationConfig.revokeUrl, {
      body: JSON.stringify({
        client_id,
        client_secret: secret,
        token,
        token_type_hint: 'access_token',
      }),
      headers: {
        Authorization: `Basic ${auth}`,
      },
      method: 'POST',
    });
    if (secondResp.status >= 300) {
      console.error(
        `${connection.providerAccountUsername}: Unable to revoke ${integrationConfig.name} access token using form post: ${resp.status}`,
      );
      console.error(await resp.text());
      console.error(
        `${connection.providerAccountUsername}: Unable to revoke ${integrationConfig.name} access token using json post: ${secondResp.status}`,
      );
      console.error(await secondResp.text());
    }
  }
};

export const accessTokenHandler: AccessTokenHandler = async (connection, req, secret, code, clientId) => {
  if (connection.accessTokenHandler) {
    return connection.accessTokenHandler(connection, req, secret, code, clientId);
  }

  const redirect_uri = getRedirectUri(connection);

  const body = new FormData();
  body.append('grant_type', 'authorization_code');
  body.append('client_id', clientId);
  body.append('client_secret', secret);
  body.append('redirect_uri', redirect_uri);
  body.append('code', code);
  const resp = await wonderfulFetch(connection.tokenUrl, {
    body: body,
    headers: {
      Accept: 'application/x-www-form-urlencoded',
    },
    isJson: false,
    method: 'POST',
  });

  if (resp.ok) {
    return resp;
  }

  return wonderfulFetch(connection.tokenUrl, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri,
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
};

export const refreshTokenHandler: RefreshTokenHandler = async (
  integration: InternalIntegration,
  secret: string,
  clientId: string,
  refreshToken: string,
) => {
  if (integration.refreshTokenHandler) {
    return integration.refreshTokenHandler(integration, secret, clientId, refreshToken);
  }
  const body = new FormData();
  body.append('grant_type', 'refresh_token');
  body.append('client_id', clientId);
  body.append('client_secret', secret);
  body.append('redirect_uri', getRedirectUri(integration));
  body.append('refresh_token', refreshToken);
  return wonderfulFetch(integration.tokenUrl, {
    body: body,
    headers: {
      Accept: 'application/x-www-form-urlencoded',
    },
    isJson: false,
    method: 'POST',
  });
};

export const getAccessToken = async (integration: InternalIntegration, resp: Response, dolog = false): Promise<OAuthToken | null> => {
  if (resp.status !== 200) {
    if (dolog) {
      console.error(`Unable to get ${integration.name} access token: ${resp.status}`);
      console.error(await resp.text());
    }
    return null;
  }

  const text = await resp.text();
  if (!text) {
    if (dolog) {
      console.error(`Unable to get ${integration.name} access token: ${resp.status}`);
    }
    return null;
  }

  // try parsing as JSON
  try {
    const jsonData = parseJSONObject(text) as OAuthResponse;
    if (jsonData.access_token) {
      return {
        access_token: jsonData.access_token,
        expires_at: getExpiresAt(jsonData),
        refresh_token: jsonData.refresh_token ?? undefined,
        uid: jsonData.uid ?? jsonData.user_id ?? undefined,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // log error?
  }

  // try parsing as form data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const formData = Object.fromEntries(
    text
      .split('&')
      .map((s) => s.split('='))
      .map((pair) => pair.map(decodeURIComponent)),
  );
  if (typeof formData !== 'object') {
    if (dolog) {
      console.error(`Unable to get ${integration.name} access token from response body: ${text}`);
    }
    return null;
  }

  const data = formData as OAuthResponse;

  if (data.access_token) {
    return {
      access_token: data.access_token,
      expires_at: getExpiresAt(data),
      refresh_token: data.refresh_token ?? undefined,
      uid: data.uid ?? data.user_id ?? undefined,
    };
  }

  if (dolog) {
    console.error(`Unable to get ${integration.name} access token from response form: ${text}`);
  }
  return null;
};
