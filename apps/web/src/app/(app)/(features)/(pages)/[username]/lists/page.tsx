import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';

import PageClient from './page-client';

interface Props {
  params: Promise<{
    username: string;
  }>;
}

export const generateMetadata = async ({ params }: Props) => {
  const { username } = await params;
  return {
    title: `Lists created by @${username} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function ListsPage() {
  return <PageClient />;
}
