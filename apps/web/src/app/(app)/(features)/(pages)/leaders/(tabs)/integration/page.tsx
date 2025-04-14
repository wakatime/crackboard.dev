import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';

import IntegrationLeadersList from './leaders-list';

export const metadata: Metadata = {
  title: `Integration Leaders - ${APP_NAME}`,
};

export default function LeadersPage() {
  return <IntegrationLeadersList />;
}
