import { z } from 'zod';

export interface Form {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

export const timelineDirectionEnum = z.enum(['asc', 'desc']);
export type TimelineDirection = z.infer<typeof timelineDirectionEnum>;
