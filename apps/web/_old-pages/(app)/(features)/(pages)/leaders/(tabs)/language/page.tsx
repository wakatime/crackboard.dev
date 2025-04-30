import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';

import IntegrationLeadersList from './leaders-list';

export const metadata: Metadata = {
  title: `Language Leaders - ${APP_NAME}`,
};

export default function LanguageLeadersPage() {
  return <IntegrationLeadersList />;
}
