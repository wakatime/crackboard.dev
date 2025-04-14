import { APP_NAME } from '@acme/core/constants';
import { db, eq } from '@acme/db/drizzle';
import { ProgramLanguage } from '@acme/db/schema';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import TopUsersList from './_components/top-users-list';

interface Props {
  params: Promise<{
    languageName: string;
  }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { languageName } = await params;
  const [language] = await db.select().from(ProgramLanguage).where(eq(ProgramLanguage.name, languageName));

  if (!language) {
    return {};
  }
  return {
    title: `Top leaders for ${language.name} language - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function LeadersForEachProviderPage({ params }: Props) {
  const { languageName } = await params;
  const [language] = await db.select().from(ProgramLanguage).where(eq(ProgramLanguage.name, languageName));

  if (!language) {
    notFound();
  }

  return (
    <main>
      <TitleBar
        title={
          <div className="flex">
            <span className="fill-foreground mr-2 h-6 w-6 rounded-full border" style={{ backgroundColor: language.color ?? undefined }} />
            <p className="line-clamp-1 text-lg font-bold leading-6">{language.name}</p>
          </div>
        }
      />
      <TopUsersList languageName={languageName} />
    </main>
  );
}
