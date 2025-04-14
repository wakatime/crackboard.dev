import { z } from 'zod';

export * from './types';

export interface Form {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

export const validateId = (id: string | undefined | null): Form => {
  const result = z.string().safeParse(id);
  if (!result.success) {
    return { error: result.error.message };
  }
  return { data: result.data };
};

export function isNonEmptyString(str: unknown): boolean {
  const validator = z.string().trim();
  try {
    validator.parse(str);
    return !!(str as string).trim();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Log error?
  }
  return false;
}

export function parseJSONObject(data: unknown): object | null {
  if (!isNonEmptyString(data)) {
    return null;
  }
  try {
    const obj = JSON.parse(atob(data as string)) as unknown;
    if (typeof obj !== 'object') {
      return null;
    }
    return obj;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    try {
      const obj = JSON.parse(data as string) as unknown;
      if (typeof obj !== 'object') {
        return null;
      }
      return obj;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      /* ignore */
    }
  }
  return null;
}

export async function responseJSON(resp: Response, defval: unknown): Promise<unknown> {
  try {
    return await resp.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return defval;
  }
}

export const companySignUpSchema = z.object({
  email: z
    .string()
    .email('Enter your company email.')
    .refine(
      (email) => {
        const e = email.toLowerCase();
        return !(
          e.includes('@gmail.') ||
          e.includes('@googlemail.') ||
          e.includes('@hotmail.') ||
          e.includes('@yahoo.') ||
          e.includes('@outlook.') ||
          e.includes('@icloud.') ||
          e.includes('@aol.') ||
          e.includes('@yandex.') ||
          e.includes('@mail.ru') ||
          e.includes('@gmx.') ||
          e.includes('@qq.') ||
          e.includes('@163.') ||
          e.includes('@live.') ||
          e.includes('@duck.') ||
          e.includes('@mozmail.') ||
          e.includes('@aleeas.') ||
          e.includes('@simplelogin.') ||
          e.includes('@protonmail.') ||
          e.includes('@proton.')
        );
      },
      {
        message: 'Enter your company email.',
      },
    ),
  isMobile: z.boolean().optional(),
});

export type CompanySignUp = z.infer<typeof companySignUpSchema>;

export const leadersFilterOptions = z.object({
  languages: z.array(z.string()).nullish(),
});

export type LeadersFilterOptions = z.infer<typeof leadersFilterOptions>;

export const createNewListSchema = z.object({
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  name: z.string().min(1).max(100),
});

export type CreateNewListDto = z.infer<typeof createNewListSchema>;

export const updateListSchema = z.object({
  description: z.string().max(500).optional(),
  id: z.string(),
  isPrivate: z.boolean().default(false).optional(),
  name: z.string().min(1).max(100).optional(),
});

export type UpdateListDto = z.infer<typeof updateListSchema>;

export const createNewPollSchema = z.object({
  allowMultipleVotes: z.boolean(),
  answers: z.array(z.string().min(1).max(300)).min(2).max(10),
  days: z.number().min(0).max(7),
  hours: z.number().min(0).max(23),
  imageId: z.string().nullable(),
  isAnonymous: z.boolean(),
  minutes: z.number().min(0).max(59),
  question: z.string().min(3).max(2000),
});

export type CreateNewPollDto = z.infer<typeof createNewPollSchema>;

export const editPollSchema = z.object({
  allowMultipleVotes: z.boolean(),
  answers: z.array(z.string().min(1).max(300)).min(2).max(10),
  id: z.string(),
  question: z.string().min(3).max(2000),
});
export type EditPollDto = z.infer<typeof editPollSchema>;

export const createNewPostSchema = z.object({
  content: z.string().min(1).max(2000),
  imageId: z.string().nullable(),
  isAnonymous: z.boolean(),
});

export const createNewReplySchema = z.object({
  content: z.string().min(1).max(2000),
  imageId: z.string().nullable(),
  isAnonymous: z.boolean(),
  parentId: z.string(),
});

export const stripControlChars = (text: string): string => {
  // strip control chars except newline
  return text.replace(/[^\P{C}\n\u200D]/gu, '');
};
