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
