import { APP_NAME } from '@acme/core/constants';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';

import ConnectionsList from '~/components/connections-list';

export const metadata: Metadata = {
  title: `Connections - ${APP_NAME}`,
};

export default function ConnectionSettingsPage() {
  return (
    <>
      <TitleBar title="Connections" />
      <ConnectionsList />
      <div className="h-48"></div>
    </>
  );
}
