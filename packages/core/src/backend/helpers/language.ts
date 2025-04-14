import { eq, or } from '@acme/db';
import { db } from '@acme/db/drizzle';
import { ProgramLanguage, ProgramLanguageAlias } from '@acme/db/schema';

export const getCachedLanguage = async (name: string) => {
  /*
  const key = `program-language-${name}`;
  if (await redis.exists(key)) {
    const cache = await redis.get(key);
    return JSON.parse(cache ?? 'null') as typeof ProgramLanguage.$inferSelect;
  }
  */

  const lang = (
    await db
      .select()
      .from(ProgramLanguage)
      .leftJoin(ProgramLanguageAlias, eq(ProgramLanguage.name, ProgramLanguageAlias.programLanguageName))
      .where(or(eq(ProgramLanguage.name, name), eq(ProgramLanguageAlias.id, name)))
  )[0]?.ProgramLanguage;

  // await redis.setex(key, Duration.hour(24).seconds, JSON.stringify(lang));
  return lang;
};

export const getCachedLanguageColor = async (name: string) => {
  const lang = await getCachedLanguage(name);
  return lang ? lang.color : null;
};

export const getCachedLanguageName = async (name: string) => {
  const lang = await getCachedLanguage(name);
  return lang ? lang.name : null;
};
