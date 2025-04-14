import { APP_NAME } from '@acme/core/constants';
import { integrations } from '@acme/core/integrations/integration-list';
import type { IntegrationIdentifier } from '@acme/db/schema';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import LeadersFilterButton from '~/components/LeadersFilterButton';

import TopUsersList from './_components/top-users-list';

interface Props {
  params: Promise<{
    provider: IntegrationIdentifier;
  }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { provider } = await params;
  const integration = integrations.find((integration) => integration.id === provider);

  if (!integration) {
    return {};
  }
  return {
    title: `Top leaders from ${integration.name} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function LeadersForEachProviderPage({ params }: Props) {
  const { provider } = await params;

  const integration = integrations.find((integration) => integration.id === provider);

  if (!integration) {
    notFound();
  }

  return (
    <main>
      <TitleBar
        title={
          <div className="flex">
            {integration.icon ? (
              <span className="fill-foreground mr-2 h-6 w-6" dangerouslySetInnerHTML={{ __html: integration.icon }} />
            ) : null}
            <p className="line-clamp-1 text-lg font-bold leading-6">{integration.name}</p>
          </div>
        }
        trailing={<LeadersFilterButton />}
      />
      <TopUsersList provider={provider} />
    </main>
  );
}
