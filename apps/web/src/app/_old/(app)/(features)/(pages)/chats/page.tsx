import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';

import PageClient from './page-client';

export const metadata: Metadata = {
  title: `Chats - ${APP_NAME}`,
};

export default function ChatsPage() {
  return <PageClient />;
}
