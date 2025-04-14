import type { Integration } from '@acme/db/schema';
import { IntegrationIdentifier } from '@acme/db/schema';
import type { NextRequest } from 'next/server';

import { getCSRFTokenCookie } from '../backend/csrf';
import { encodeRS256JWT } from '../backend/jwt';
import { BASE_URL } from '../constants';
import { env } from '../env';
import type { InternalIntegration, OAuthResponse } from '../types';
import { integrations } from './integration-list';

export const getRedirectUri = (integration: InternalIntegration): string => {
  const id = integration.id;
  if (
    env.NODE_ENV === 'development' &&
    (id == IntegrationIdentifier.ProductHunt ||
      id == IntegrationIdentifier.Instagram ||
      id == IntegrationIdentifier.Tiktok ||
      id == IntegrationIdentifier.Wikipedia)
  ) {
    return `https://wonderful.dev/onboard/callback/${id}`;
  }
  return `${BASE_URL}/onboard/callback/${id}`;
};

export const getOAuthUrl = async (integration: InternalIntegration, req: NextRequest): Promise<string> => {
  if (!integration.authorizeUrl || !integration.clientId) {
    return '';
  }
  const scope = integration.scopes?.default;

  // overwrite integration configs in DEV using .env file
  // eslint-disable-next-line no-restricted-properties
  const authorize_url = process.env[`INTEGRATION_${integration.id.toUpperCase()}_AUTHORIZE_URL`] ?? integration.authorizeUrl;
  // eslint-disable-next-line no-restricted-properties
  const client_id = process.env[`INTEGRATION_${integration.id.toUpperCase()}_CLIENT_ID`] ?? integration.clientId;
  const token = await getCSRFTokenCookie(req);
  const state = encodeURIComponent(btoa(JSON.stringify({ c: token })));

  if (integration.authorizeUrlBuilder) {
    return await integration.authorizeUrlBuilder(integration, req, scope, authorize_url, client_id, state);
  }

  let url = `${authorize_url}?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};

export interface FetchOptions extends RequestInit {
  /** Sets Accept and Content-Type headers. */
  isJson?: boolean;
  /** Number of seconds to wait for response before aborting the request. */
  timeout?: number;
}

/* wonderfulFetch is a wrapper around node fetch that:
   - Sets a default User-Agent
   - Sets a default Request Timeout
   - Sets Accept and Content-Type headers if isJson is true.
 */
export const wonderfulFetch = async (url: string, init?: FetchOptions): Promise<Response> => {
  const timeout = init?.timeout ?? 10;
  const isJson = init?.isJson ?? true;

  const options: RequestInit = init ?? {};

  options.headers = new Headers(options.headers ?? {});
  if (!options.headers.has('User-Agent')) {
    options.headers.set('User-Agent', 'wonderful.dev');
  }
  if (isJson && !options.headers.has('Accept')) {
    options.headers.set('Accept', 'application/json');
  }

  if (!options.method) {
    options.method = 'GET';
  }

  if (isJson && options.method !== 'GET' && !options.headers.has('Content-Type')) {
    options.headers.set('Content-Type', 'application/json');
  }

  if (!options.signal) {
    options.signal = AbortSignal.timeout(timeout * 1000);
  }

  return fetch(url, options);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rJT = async (r: Response): Promise<any> => {
  try {
    const j = await r.json();
    if (j) {
      return j as unknown;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }

  return await r.text();
};

export const gitHubAppRequest = async (connection: typeof Integration.$inferSelect, method: string, url: string, body?: string) => {
  const integrationConfig = integrations.find((i) => {
    return i.id === connection.provider;
  });
  if (!integrationConfig) {
    return undefined;
  }

  const appId =
    // eslint-disable-next-line no-restricted-properties
    process.env[`INTEGRATION_${connection.provider.toUpperCase()}_APP_ID`] ??
    (integrationConfig.extraAppInfo as { appId: string } | null)?.appId;
  if (!appId) {
    return undefined;
  }

  if (!env.INTEGRATION_GITHUB_SECRET_KEY) {
    return;
  }

  const jwt = await encodeRS256JWT(appId, env.INTEGRATION_GITHUB_SECRET_KEY);
  const payload: FetchOptions = {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
    },
    method: method,
  };
  if (body) {
    payload.body = body;
  }
  return await wonderfulFetch(url, payload);
};

export const getExpiresAt = (data: OAuthResponse): Date | undefined => {
  if (data.expires_at) {
    return new Date(data.expires_at);
  }
  if (data.expires_in) {
    if (typeof data.expires_in === 'string') {
      data.expires_in = parseInt(data.expires_in);
    }
    return new Date(Date.now() + data.expires_in);
  }
  return undefined;
};
