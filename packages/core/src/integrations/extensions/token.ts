import { getCSRFTokenCookie } from '../../backend/csrf';
import type { AccessTokenHandler } from '../../types';
import { getRedirectUri, wonderfulFetch } from '../helpers';

export const TwitterAccessTokenHandler: AccessTokenHandler = async (integration, req, secret, code, clientId) => {
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const body = JSON.stringify({
    client_id: clientId,
    code: code,
    code_verifie: (await getCSRFTokenCookie(req)) ?? '',
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri(integration),
  });
  return wonderfulFetch('https://api.twitter.com/2/oauth2/token', {
    body: body,
    headers: {
      Authorization: `Basic ${auth}`,
    },
    method: 'POST',
  });
};

export const LinkedinAccessTokenHandler: AccessTokenHandler = async (connection, _req, secret, code, clientId) => {
  const redirect_uri = getRedirectUri(connection);
  return wonderfulFetch(
    `${
      connection.tokenUrl
    }?grant_type=authorization_code&client_id=${clientId}&client_secret=${secret}&code=${code}&redirect_uri=${encodeURIComponent(
      redirect_uri,
    )}`,
    {
      method: 'POST',
    },
  );
};

export const YouTubeAccessTokenHandler: AccessTokenHandler = async (integration, _req, secret, code, clientId) => {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: secret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri(integration),
  }).toString();

  return wonderfulFetch(integration.tokenUrl, {
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
};

export const TikTokAccessTokenHandler: AccessTokenHandler = async (connection, _req, secret, code, clientId) => {
  const redirect_uri = getRedirectUri(connection);
  const body = new URLSearchParams({
    client_key: clientId,
    client_secret: secret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirect_uri,
  }).toString();
  return wonderfulFetch(connection.tokenUrl, {
    body: body,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
};

export const RedditAccessTokenHandler: AccessTokenHandler = async (connection, _req, secret, code, clientId) => {
  const redirect_uri = getRedirectUri(connection);
  const params = new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri });
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  return wonderfulFetch(`${connection.tokenUrl}?${params.toString()}`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    method: 'POST',
  });
};
