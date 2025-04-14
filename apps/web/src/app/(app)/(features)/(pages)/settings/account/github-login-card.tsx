'use client';

import { IntegrationIdentifier } from '@acme/db/schema';
import CustomLink from '@acme/ui/components/CustomLink';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import pluralize from 'pluralize';
import { FaGithub } from 'react-icons/fa6';

import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

export default function GithubLogInCard() {
  const { currentUser } = useAuth();
  const { data: integrations } = api.integrations.allIntegrationsForCurrentUser.useQuery();

  const extraAccounts =
    integrations
      ?.filter((i) => i.id == IntegrationIdentifier.GitHub)
      .flatMap((i) => i.connections)
      .filter((c) => c.providerAccountId !== String(currentUser?.githubId)) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub login {pluralize('account', extraAccounts.length)}</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomLink className="flex items-end" href={currentUser?.githubProfileUrl ?? '#'} newWindow={true} showExternalIcon={true}>
          <FaGithub
            style={{
              display: 'inline-block',
              marginBottom: '3px',
              marginRight: '4px',
            }}
          />
          github.com/{currentUser?.githubUsername}
        </CustomLink>
        {extraAccounts.length > 0 &&
          extraAccounts.map((c) => {
            return (
              <CustomLink
                className="mt-1 flex items-end"
                href={`https://github.com/${c.providerAccountUsername}`}
                key={c.providerAccountUsername}
                newWindow={true}
              >
                <FaGithub
                  style={{
                    display: 'inline-block',
                    marginBottom: '3px',
                    marginRight: '4px',
                  }}
                />
                github.com/{c.providerAccountUsername}
              </CustomLink>
            );
          })}
      </CardContent>
    </Card>
  );
}
