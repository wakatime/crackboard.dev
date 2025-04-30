import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';

import PageClient from './page-client';

export const metadata: Metadata = {
  title: `Settings - ${APP_NAME}`,
};

export default function SettingsPage() {
  return <PageClient />;
}
