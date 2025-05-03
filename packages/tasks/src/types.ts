export interface Stat {
  name: string;
  total_seconds: number;
  digital: string;
  decimal: string;
  text: string;
  hours: number;
  minutes: number;
  seconds: number;
  percent: number;
}

export interface SummariesResult {
  data: Summary[];
  start: string;
  end: string;
  cumulative_total: {
    seconds: number;
    text: string;
    digital: string;
    decimal: string;
  };
  daily_average: {
    holidays: number;
    days_minus_holidays: number;
    days_including_holidays: number;
    seconds: number;
    seconds_including_other_language: number;
    text: string;
    text_including_other_language: string;
  };
}

export interface Summary {
  grand_total: {
    hours: number;
    minutes: number;
    total_seconds: number;
    digital: string;
    decimal: string;
    text: string;
  };
  range: {
    start: string;
    end: string;
    date: string;
    text: string;
    timezone: string;
  };
  languages: Stat[];
  editors: Stat[];
}
