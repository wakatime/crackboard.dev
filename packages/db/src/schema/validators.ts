import { z } from 'zod';

export enum IntegrationIdentifier {
  GitHub = 'github',
  GitLab = 'gitlab',
  Instagram = 'instagram',
  HackerNoon = 'hackernoon',
  KoFi = 'ko_fi',
  LinkedIn = 'linkedin',
  Patreon = 'patreon',
  ProductHunt = 'product_hunt',
  Reddit = 'reddit',
  StackExchange = 'stack_exchange',
  Tiktok = 'tiktok',
  Twitch = 'twitch',
  Unsplash = 'unsplash',
  WakaTime = 'wakatime',
  Wikipedia = 'wikipedia',
  X = 'x',
  YCombinator = 'y_combinator',
  YouTube = 'youtube',
}

export const timelineFilterSchema = z.object({
  excludingReplies: z.boolean().nullish(),
  following: z.boolean().nullish(),
  from: z.array(z.string()).max(20).nullish(),
  includeAll: z.array(z.string()).max(60).nullish(),
  includeAny: z.array(z.string()).max(60).nullish(),
  includeExact: z.array(z.string()).max(60).nullish(),
  maxReactions: z.number().min(0).nullish(),
  maxReplies: z.number().min(0).nullish(),
  media: z.boolean().nullish(),
  mentions: z.array(z.string()).max(60).nullish(),
  minReactions: z.number().min(0).nullish(),
  minReplies: z.number().min(0).nullish(),
  postTypes: z.array(z.string()).max(60).nullish(),
  programLanguages: z.array(z.string()).max(60).nullish(),
  providers: z.array(z.nativeEnum(IntegrationIdentifier)).max(60).nullish(),
  tags: z.array(z.string()).max(60).nullish(),
  trending: z.boolean().nullish(),
});

export type TimelineFilter = z.infer<typeof timelineFilterSchema>;
