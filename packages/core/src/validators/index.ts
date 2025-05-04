import { z } from 'zod';

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

export const stripControlChars = (text: string): string => {
  // strip control chars except newline
  return text.replace(/[^\P{C}\n\u200D]/gu, '');
};

export const updateLeaderboardConfigSchema = z.object({
  isPublic: z.boolean(),
  isInviteOnly: z.boolean(),
});

export type UpdateLeaderboardConfigData = z.infer<typeof updateLeaderboardConfigSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  bio: z.string().max(500).optional(),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;
