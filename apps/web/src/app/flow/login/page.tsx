import { getLeaderboardConfig } from '@workspace/core/backend/helpers/leaderboard';

import InviteCodeNeeded from './invite-code-needed';
import LogInForm from './login-form';

export default async function LogInPage({ searchParams }: { searchParams: Promise<{ next?: string; inviteCode?: string }> }) {
  const { next, inviteCode } = await searchParams;

  const config = await getLeaderboardConfig();
  if (config.isInviteOnly && config.inviteCode !== inviteCode) {
    console.error(`Invalid invite code: ${inviteCode}`);
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="container max-w-sm">
          <InviteCodeNeeded />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="container max-w-sm">
        <LogInForm next={next} />
      </div>
    </div>
  );
}
