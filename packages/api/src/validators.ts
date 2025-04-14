import { z } from 'zod';

export const tabPresetEnum = z.enum(['everything', 'following', 'interests', 'trends']);
export type TabPreset = z.infer<typeof tabPresetEnum>;

export interface PresetListItem {
  description: string;
  id: TabPreset;
  name: string;
}

export const TABS_PRESET_LIST: PresetListItem[] = [
  {
    description: 'The firehose',
    id: 'everything',
    name: 'Everything',
  },
  {
    description: 'Posts about tech you use',
    id: 'interests',
    name: 'Interests',
  },
  {
    description: 'Recently popular posts',
    id: 'trends',
    name: 'Trends',
  },
  {
    description: 'Only posts from people you follow',
    id: 'following',
    name: 'Following',
  },
];

export const sendChatMessageSchemaDto = z.object({
  text: z.string().min(1, { message: 'Required' }).max(5000),
  companyId: z.string(),
});

export type SendChatMessageDto = z.infer<typeof sendChatMessageSchemaDto>;
