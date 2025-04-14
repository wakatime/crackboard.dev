import { Duration } from 'ts-duration';

export const asDuration = (obj?: Duration | { seconds: number } | number, def?: number): Duration => {
  if (obj instanceof Duration) {
    return obj;
  }
  if (typeof obj === 'object' && typeof obj.seconds === 'number') {
    return obj as Duration;
  }
  if (typeof obj === 'number') {
    return Duration.second(obj);
  }
  return Duration.second(def ?? 0);
};
