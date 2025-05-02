export interface PublicUser {
  id: string;
  createdAt: Date;
  name: string | null;
  url: string;
  username: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface AuthContextType {
  currentUser?: PublicUser;
  isAuthenticated: boolean | undefined;
  isFetching: boolean;
  isLoading: boolean;
  refetch?: () => unknown;
  signOut: () => Promise<void>;
}

export interface OAuthResponse {
  access_token: string;
  expires_at?: string | null;
  expires_in?: string | number;
  refresh_token?: string | null;
  uid?: string | null;
  user_id?: string | null;
}

export interface OAuthToken {
  access_token: string;
  expires_at?: Date;
  refresh_token?: string;
  uid?: string;
}

export interface OAuthLoginState {
  c: string;
  follow?: string;
  n?: string;
  m?: boolean;
}

export interface WakaTimeUser {
  id: string;
  email?: string | null;
  full_name: string | null;
  total_seconds?: number;
  username: string | null;
  photo: string | null;
}

// https://wakatime.com/developers/#stats
export interface WakaTimeStats {
  categories: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  daily_average: number;
  daily_average_including_other_language: number;
  editors: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  human_readable_total: string;
  human_readable_total_including_other_language: string;
  languages: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  operating_systems: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  total_seconds?: number;
  total_seconds_including_other_language?: number;
}

export interface WakaTimeSummaries {
  data: WakaTimeSummary[];
  cumulative_total: {
    seconds: number;
    text: string;
    decimal: string;
    digital: string;
  };
  daily_average: {
    holidays: number;
    days_including_holidays: number;
    days_minus_holidays: number;
    seconds: number;
    text: string;
    seconds_including_other_language: number;
    text_including_other_language: string;
  };
  start: string;
  end: string;
}

// https://wakatime.com/developers/#summaries
export interface WakaTimeSummary {
  categories?: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  daily_average: number;
  daily_average_including_other_language: number;
  editors: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  human_readable_total: string;
  human_readable_total_including_other_language: string;
  languages: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  operating_systems?: {
    hours: number;
    minutes: number;
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  total_seconds?: number;
  total_seconds_including_other_language?: number;
  range: {
    date: string;
    start: string;
    end: string;
    text: string;
    timezone: string;
  };
  grand_total: {
    digital: string;
    hours: number;
    minutes: number;
    text: string;
    total_seconds: number;
  };
}

export interface Leader {
  rank: number;
  id: string;
  username: string | undefined;
  totalSeconds: number;
  languages: LeaderStat[];
  editors: LeaderStat[];
}

export interface LeaderStat {
  name: string;
  totalSeconds: number;
}
