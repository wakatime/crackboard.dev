'use client';

import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

import { api } from '~/trpc/client';

export default function Footer() {
  const leaderboardConfigQuery = api.leaderboard.getLeaderboardPublicConfig.useQuery();

  if (!leaderboardConfigQuery.data) {
    return (
      <footer className="bg-background mt-20">
        <div className="container mx-auto flex h-28 max-w-7xl items-center gap-4 px-4 md:px-8">
          <div className="flex-1"></div>

          <div className="flex items-center gap-2">
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
      <div className="container mx-auto flex h-28 max-w-7xl items-center gap-4 px-4 md:px-8">
        <div className="flex-1">{leaderboardConfigQuery.data.timezone}</div>

        <div className="flex items-center gap-2">
          <Link href="https://github.com/wakatime/crackboard.dev" title={leaderboardConfigQuery.data.commitSha}>
            <FaGithub />
          </Link>
        </div>
      </div>
    </footer>
  );
}
