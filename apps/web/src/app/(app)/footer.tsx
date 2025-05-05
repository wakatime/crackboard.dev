'use client';

import { formatNumberWithSuffix } from '@workspace/core/utils';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

import { api } from '~/trpc/client';

export default function Footer() {
  const leaderboardConfigQuery = api.leaderboard.getLeaderboardPublicConfig.useQuery();

  if (!leaderboardConfigQuery.data) {
    return (
      <footer className="bg-background mt-20">
        <div className="container mx-auto flex h-28 items-center gap-4 px-4 md:px-12">
          <div className="ml-6 flex-1"></div>

          <div className="mr-2 flex items-center gap-2">
            <Link href="https://github.com/wakatime/crackboard.dev">
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
        <div className="text-muted-foreground ml-6 flex-1 text-sm">
          Timezone {leaderboardConfigQuery.data.timezone} · Refreshing every{' '}
          {formatNumberWithSuffix(leaderboardConfigQuery.data.refreshRateInHours, 'hour')}
        </div>

        <div className="mr-2 flex items-center gap-2">
          <Link href="https://github.com/wakatime/crackboard.dev" title={leaderboardConfigQuery.data.commitSha}>
            <FaGithub />
          </Link>
        </div>
      </div>
    </footer>
  );
}
