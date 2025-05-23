import { init } from '@paralleldrive/cuid2';
import { formatDistanceStrict } from 'date-fns';
import { humanId } from 'human-id';
import pluralize from 'pluralize';
import { parse } from 'tldts';

import { APP_DOMAIN, BASE_URL } from '../constants';
import type { PublicUser } from '../types';

export const roundWithPrecision = (n: number, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(n * factor + Number.EPSILON) / factor;
};

export const parseNumber = (s: string) => {
  s = s.toLowerCase().trim();
  if (s.length < 2) {
    return parseInt(s);
  }

  // convert from EU-style (4.000,00) to US-style (4,000.00) then remove commas
  if (s.match(/,\d\d?\w?$/g)) {
    s = s.replaceAll('.', '').replaceAll(',', '.');
  }
  s = s.replaceAll(',', '');

  const ending = s.charAt(s.length - 1);
  const trimmed = s.slice(0, -1).trimEnd();
  switch (ending) {
    case 'k':
      return parseFloat(trimmed) * 1000;
    case 'm':
      return parseFloat(trimmed) * 1000 * 1000;
    case 'b':
      return parseFloat(trimmed) * 1000 * 1000 * 1000;
    case 't':
      return parseFloat(trimmed) * 1000 * 1000 * 1000 * 1000;
    case 'q':
      return parseFloat(trimmed) * 1000 * 1000 * 1000 * 1000 * 1000;
    default:
      return parseFloat(s);
  }
};

export const formatNumberWithSuffix = (
  i: number,
  suffix: string,
  opts?: { plural?: string; precision?: number; round?: boolean },
): string => {
  const formatted = formatNumber(i, { precision: opts?.precision, round: opts?.round });
  const s = opts?.plural ? getSuffixForNumber(i, suffix, opts) : pluralize(suffix, i);
  return `${formatted} ${s}`;
};

export const formatNumber = (i: number, opts?: { long?: boolean; precision?: number; round?: boolean }): string => {
  if (isNaN(i)) {
    i = 0;
  }

  let formatted = i.toLocaleString('en-US');
  if (opts?.long) {
    return formatted;
  }

  const round = (opts?.round && (opts.precision ?? 1) > 0) ?? (opts?.precision ?? 1) > 0;

  let unit = '';
  let divisor = 0;
  if (i < 1000000) {
    if (i > 999) {
      unit = 'K';
      divisor = 1000;
    }
  } else {
    divisor = 1000000;
    unit = 'M';
  }

  if (divisor > 0) {
    if (round) {
      formatted = roundWithPrecision(i / divisor, opts?.precision ?? (Math.floor(i / divisor) < 2 ? 2 : 1)).toLocaleString('en-US');
    } else {
      formatted = (i / divisor).toLocaleString('en-US');
    }
  } else if (round) {
    if (formatted.split('.').length > 1) {
      formatted = roundWithPrecision(i, opts?.precision ?? (Math.floor(i) < 2 ? 2 : 1)).toLocaleString('en-US');
    }
  }

  return `${formatted}${unit}`;
};

export const getSuffixForNumber = (i: number, suffix: string, opts?: { plural?: string }): string => {
  if (isNaN(i)) {
    i = 0;
  }
  i = Math.floor(i);
  const plural = opts?.plural ?? `${suffix}s`;
  return i === 1 ? suffix : plural;
};

export const getLinksFromResponse = (response: Response): Map<string, string> => {
  return new Map<string, string>(
    response.headers
      .get('Link')
      ?.split(',')
      .map((link) => link.match(/<(?<url>[^>]+)>; rel="(?<rel>[^"]+)"/g))
      .filter((match) => {
        return match?.groups?.rel && match.groups.url;
      })
      .map((match) => [match?.groups?.rel ?? '', match?.groups?.url ?? '']) ?? [],
  );
};

export const pagify = (total: number, page: number, limit = 20) => {
  const pageV = Math.round(page) > 0 ? Math.round(page) : 1;
  const offset = (pageV - 1) * limit;
  return {
    limit,
    nextPage: pageV * limit >= total ? null : pageV + 1,
    offset,
    page: pageV,
    prevPage: pageV - 1 > 0 ? pageV - 1 : null,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const pagesRange = (totalPages: number, page: number) => {
  let start = page - 2;
  if (start < 1) {
    start = 1;
  }
  let end = start + 4;
  if (end > totalPages) {
    end = totalPages;
    start = end - 4;
    if (start < 1) {
      start = 1;
    }
  }
  return range(start, end);
};

export const range = (start: number, end: number): number[] => {
  if (start == end) {
    return [start];
  }
  return [start, ...range(start + 1, end)];
};

export const firstCharUppercase = (s?: string) => {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const truncate = (s: string, maxlen = 60) => {
  if (typeof s !== 'string') {
    return s;
  }
  return s.length < maxlen ? s : `${s.substring(0, maxlen - 1)}…`;
};

export const relativeDate = (date: Date) => {
  return formatDistanceStrict(date, new Date(), { addSuffix: true });
};

export const roundToMostSignificantDigit = (n: number) => {
  if (n < 10) {
    return 0;
  }
  const denominator = Math.pow(10, Math.floor(Math.abs(n)).toString().length - 1);
  return Math.floor(n / denominator) * denominator;
};

export const formatListWithAnd = (items: string[]): string => {
  if (items.length <= 2) {
    return items.join(' and ');
  }
  const last = items.pop();
  return `${items.join(', ')}, and ${last}`;
};

export const hostnameFromUrl = (url: string) => {
  try {
    return _normalizeHostname(new URL(url).hostname);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }
  try {
    return _normalizeHostname(new URL(`http://${url}`).hostname);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }
};

/* Returns the domain (without subdomain) for a url or email. */
export const getDomainFromUrl = (url: string) => {
  let hostname = hostnameFromUrl(url);
  if (!hostname) {
    if (url.includes('@')) {
      hostname = hostnameFromUrl(url.split('@').at(-1) ?? '');
    }
    return;
  }
  const parts = hostname.split('.');
  if (parts.length < 2) {
    return;
  }

  return `${parts.at(-2)}.${parts.at(-1)}`;
};

const _normalizeHostname = (hostname: string) => {
  if (hostname.startsWith('www.')) {
    hostname = hostname.substring('www.'.length);
  }
  return hostname.toLowerCase();
};
export const makeExternalUrl = (url: string) => {
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  if (url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
};

export const isExternalUrl = (url: string | null | undefined, requireProtocol = false) => {
  if (!url) {
    return false;
  }

  if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
    if (requireProtocol) {
      return false;
    }

    if (url.startsWith('/')) {
      return false;
    }

    // don't allow urls starting with non-http protocols
    if (url.match(/^[a-zA-Z]+:\/\//gi)) {
      return false;
    }

    url = `https://${url}`;
  }

  // don't allow links to ipv4 or ipv6 addresses
  if (
    url.match(
      /^https?:\/\/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gi,
    ) ??
    url.match(/^https?:\/\/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}/gi)
  ) {
    return false;
  }

  // don't allow links to current website domain
  try {
    const origin = new URL(url).origin;
    if (origin === BASE_URL) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }

  return true;
};

export const validateTLD = (url: string | null | undefined) => {
  if (!url) {
    return null;
  }

  url = url.trim();

  const result = parse(url);
  if (!result.isIcann && !result.isIp) {
    return null;
  }

  return url;
};

export const anonymousUserId = () => {
  const human = humanId({ capitalize: false });
  const maxlen = 10;
  const truncated = human.length < maxlen ? human : human.substring(0, maxlen - 1);
  const createId = init({ length: 4 });
  const id = createId();
  return `${truncated}${id}`;
};

export const getUserDisplayUsername = (user: Pick<PublicUser, 'id' | 'username'>): string => {
  return user.username ? `@${user.username}` : user.id;
};

export const getUserDisplayName = (user: Pick<PublicUser, 'id' | 'name' | 'username'>): string => {
  return user.name ?? user.username ?? user.id;
};

export function swapElements<T>(array: T[], index1: number, index2: number): T[] {
  if (index1 < 0 || index2 < 0 || index1 >= array.length || index2 >= array.length) {
    throw new Error('Index out of bounds');
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const temp = array[index1]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  array[index1] = array[index2]!;
  array[index2] = temp;
  return array;
}

export function today() {
  const now = new Date();
  return dateToDateString(now);
}

export function dateToDateString(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function dateStringToDate(date: string) {
  const reg = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!reg.test(date)) {
    throw new Error('Invalid date!');
  }

  const [year, month, day] = date.split('-');

  const d = new Date();
  d.setUTCFullYear(Number(year));
  d.setUTCMonth(Number(month) - 1);
  d.setUTCDate(Number(day));

  return d;
}

export function getReadableTextColor(hex?: string, def: 'black' | 'white' = 'white'): 'black' | 'white' {
  if (!hex) {
    return def;
  }

  hex = hex.replace('#', '');

  // parse r, g, b
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? 'black' : 'white';
}

export interface FetchOptions extends RequestInit {
  /** Sets Accept and Content-Type headers. */
  isJson?: boolean;
  /** Number of seconds to wait for response before aborting the request. */
  timeout?: number;
}

/* betterFetch is a wrapper around node fetch that:
   - Sets a default User-Agent
   - Sets a default Request Timeout
   - Sets Accept and Content-Type headers if isJson is true.
 */
export const betterFetch = async (url: string, init?: FetchOptions): Promise<Response> => {
  const timeout = init?.timeout ?? 10;
  const isJson = init?.isJson ?? true;

  const options: RequestInit = init ?? {};

  options.headers = new Headers(options.headers ?? {});
  if (!options.headers.has('User-Agent')) {
    options.headers.set('User-Agent', APP_DOMAIN);
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
