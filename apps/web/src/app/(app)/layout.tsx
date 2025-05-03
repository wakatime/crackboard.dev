import { authenticatedUserFromRequest } from '@workspace/core/backend/auth';
import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import NavBar from './nav-bar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const config = await getLeaderboardConfig();

  if (!config.isPublic) {
    const user = await authenticatedUserFromRequest();

    if (!user) {
      redirect('/flow/login');
    }
  }

  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
