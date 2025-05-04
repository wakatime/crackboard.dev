import { env } from '../env';

export const APP_DOMAIN = env.NEXT_PUBLIC_APP_DOMAIN;
export const APP_DESC = 'The daily leaderboard for devs';

export const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
export const APP_SCHEME = 'crackboard.dev://';
export const SS_LOCATION_HISTORY = 'location-history';

export const DAY = 24 * 60 * 60;
export const JWT_EXPIRES = 400 * DAY;
export const CSRF_EXPIRES = 7 * DAY;

export const LOGIN_COOKIE = 'login';
export const CSRF_COOKIE = 'csrftoken';
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const WAKATIME_AUTHORIZE_URL = 'https://wakatime.com/oauth/authorize';
export const WAKATIME_TOKEN_URL = 'https://wakatime.com/oauth/token';
export const WAKATIME_REDIRECT_URI = `${BASE_URL}/login/callback`;
export const WAKATIME_API_URI = 'https://api.wakatime.com/api/v1';

export const WAKAQ_TASKS_DISABLED_KEY = 'wakaq-disabled';

export const REFRESH_RATE = env.NEXT_PUBLIC_REFRESH_RATE ?? 12;

export const COMMIT_SHA = env.NEXT_PUBLIC_COMMIT_SHA ?? '';

export const AUDIT_LOG_LOGIN = 'login';
export const AUDIT_LOG_USERNAME_CHANGED = 'username changed';
export const AUDIT_LOG_USER_CREATED = 'user created';
export const AUDIT_LOG_USER_DELETED = 'user deleted';

export const SIDEBAR_DISABLED_ROUTES = ['/admin', '/privacy', '/terms'];

export const appStoreUrls = {
  ios: 'itms-appss://apps.apple.com/app/id6740625585',
  android: 'https://play.google.com/store/apps/details?id=wonderful.dev',
};
