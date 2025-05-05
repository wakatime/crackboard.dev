'use client';

import { formatNumberWithSuffix } from '@workspace/core/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

import type { RouterOutputs } from '~/trpc/client';
import { api } from '~/trpc/client';

export default function Footer() {
  const leaderboardConfigQuery = api.leaderboard.getLeaderboardPublicConfig.useQuery();

  if (!leaderboardConfigQuery.data) {
    return (
      <footer className="bg-background mt-20">
        <div className="container mx-auto flex h-28 items-center gap-4 px-4 md:px-12">
          <div className="ml-2 flex-1"></div>

          <div className="mr-2 flex items-center gap-2">
            <Link href="https://github.com/wakatime/crackboard.dev" title="Open source on GitHub">
              <FaGithub />
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-background mt-20">
      <div className="container mx-auto flex h-28 items-center gap-4 px-4 md:px-12">
        <div className="ml-2 flex-1">
          <FooterInfo config={leaderboardConfigQuery.data} />
        </div>

        <div className="mr-2 flex items-center gap-2">
          <p className="text-muted-foreground text-sm">
            <Link href="https://github.com/wakatime/crackboard.dev" title="Open source on GitHub" className="text-muted-foreground">
              <FaGithub className="inline" />
            </Link>
            {' · '}
            <Link
              href={`https://github.com/wakatime/crackboard.dev/commit/${leaderboardConfigQuery.data.commitSha}`}
              title="Current production version"
              className="text-muted-foreground"
            >
              {leaderboardConfigQuery.data.commitSha}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterInfo({ config }: { config: NonNullable<RouterOutputs['leaderboard']['getLeaderboardPublicConfig']> }) {
  return (
    <p className="text-muted-foreground text-sm">
      <span>Timezone {config.timezone}</span>
      {config.lastRefreshedAt && (
        <>
          {' · '}
          <span>
            Last updated{' '}
            <span title={formatInTimeZone(config.lastRefreshedAt, config.timezone, 'h:mm aaa MMM do zzz')}>
              {formatDistanceToNowStrict(config.lastRefreshedAt, { addSuffix: true })}
            </span>
          </span>
        </>
      )}
      {' · '}
      <span>Refreshing every {formatNumberWithSuffix(config.refreshRateInHours, 'hour')}</span>
    </p>
  );
}
