import { getCSRFTokenCookie } from '../../backend/csrf';
import type { AuthorizeUrlBuilder } from '../../types';
import { getRedirectUri } from '../helpers';

export const TwitterAuthorizeUrlBuilder: AuthorizeUrlBuilder = async (
  integration,
  req,
  scope,
  authorize_url,
  client_id,
  state,
): Promise<string> => {
  const challenge = await getCSRFTokenCookie(req);

  let url = `${authorize_url}?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&code_challenge=${challenge}&code_challenge_method=plain&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};

export const TikTokAuthorizeUrlBuilder: AuthorizeUrlBuilder = async (
  integration,
  req,
  scope,
  authorize_url,
  client_id,
  state,
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<string> => {
  let url = `${authorize_url}?response_type=code&client_key=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};
