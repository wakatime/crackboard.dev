import { APP_NAME } from '@acme/core/constants';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';

import DeleteAccountCard from './delete-account-card';
import GithubLogInCard from './github-login-card';
import ToggleThemeCard from './toggle-theme-card';

export const metadata: Metadata = {
  title: `Account - ${APP_NAME}`,
};

export default function Page() {
  return (
    <>
      <TitleBar title="Account" homeHref="/settings" />
      <div className="space-y-4 p-4">
        <GithubLogInCard />
        <ToggleThemeCard />
        <DeleteAccountCard />
      </div>
      <div className="h-48"></div>
    </>
  );
}
