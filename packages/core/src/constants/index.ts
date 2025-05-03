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

export const AUDIT_LOG_LOGIN = 'login';
export const AUDIT_LOG_USERNAME_CHANGED = 'username changed';
export const AUDIT_LOG_USER_CREATED = 'user created';
export const AUDIT_LOG_USER_DELETED = 'user deleted';
export const AUDIT_LOG_USER_CONNECTED_INTEGRATION = 'user connected integration';
export const AUDIT_LOG_USER_DISCONNECTED_INTEGRATION = 'user disconnected integration';
export const AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED = 'profile default changed';
export const AUDIT_LOG_USER_PROFILE_BIO_CHANGED = 'profile bio changed';
export const AUDIT_LOG_FOLLOWED_USER = 'followed user';
export const AUDIT_LOG_UNFOLLOWED_USER = 'un-followed user';
export const AUDIT_LOG_POST_CREATED = 'post created';
export const AUDIT_LOG_POST_DELETED = 'post deleted';
export const AUDIT_LOG_POST_FLAGGED = 'post flagged';
export const AUDIT_LOG_USER_BLOCKED_USER = 'blocked user';
export const AUDIT_LOG_USER_UNBLOCKED_USER = 'un-blocked user';
export const AUDIT_LOG_POST_EDITED = 'post edited';
export const AUDIT_LOG_VOTE_CASTED = 'vote casted';
export const AUDIT_LOG_VOTE_REVERSED = 'vote reversed';
export const AUDIT_LOG_REACTED_TO_POST = 'reacted to post';
export const AUDIT_LOG_REACTION_REMOVED_FROM_POST = 'reaction removed from post';
export const AUDIT_LOG_REPLIED_TO_POST = 'replied to post';
export const AUDIT_LOG_REPLY_DELETED = 'reply deleted';
export const AUDIT_LOG_REPLY_HIDDEN = 'reply hidden';
export const AUDIT_LOG_ANONYMOUS_POST_REVEALED = 'anonymous post revealed';
export const AUDIT_LOG_STARRED_COMPANY = 'starred company';
export const AUDIT_LOG_STARRED_JOB = 'starred job';

export const SIDEBAR_DISABLED_ROUTES = ['/admin', '/privacy', '/terms'];

export const appStoreUrls = {
  ios: 'itms-appss://apps.apple.com/app/id6740625585',
  android: 'https://play.google.com/store/apps/details?id=wonderful.dev',
};
