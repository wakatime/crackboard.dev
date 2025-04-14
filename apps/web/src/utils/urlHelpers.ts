import { BASE_URL } from '@acme/core/constants';

/**
 * Converts a URL string or URL object into a safe, absolute URL
 * always using BASE_URL as the prefix. Always use this when redirecting
 * to urls that should NEVER be external, to safeguard against open redirect vulns.
 * Note: Never use with NextResponse.rewrite() inside middleware, instead use:
 * new URL('/path', req.url) in middlewares.
 *
 * @param url - The URL to convert.
 * @param fallbackUrl - Optional fallback URL to use if the input URL is invalid. Defaults to BASE_URL.
 * @returns A new URL object with absolute path, or BASE_URL as a URL object.
 *
 * @example
 * makeUrlSafe('/about') // Returns: new URL('https://wonderful.dev/about')
 * makeUrlSafe(null, '/home') // Returns: new URL('https://wonderful.dev/home')
 * makeUrlSafe('https://malicious-site.com/home') // Returns: new URL('https://wonderful.dev/https://malicious-site.com/home')
 */
export const makeUrlSafe = (url: string | URL | null | undefined, fallbackUrl: string | URL | undefined = undefined): URL => {
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  if (!fallbackUrl) {
    fallbackUrl = base;
  }
  if (!url) {
    url = fallbackUrl;
  }
  try {
    url = url.toString();
    if (url.startsWith(base)) {
      return new URL(url, BASE_URL);
    }
    if (url.startsWith('/')) {
      url = url.slice(1);
    }
    return new URL(`${base}${url}`, BASE_URL);
  } catch (e) {
    console.error(e);
  }
  return new URL(base, BASE_URL);
};
