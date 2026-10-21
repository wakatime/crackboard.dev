import { cookies } from 'next/headers';

import PageClient from './page-client';

export default async function Page() {
  const initialMetric = (await cookies()).get('leaderboard-metric')?.value;
  return <PageClient initialMetric={initialMetric} />;
}
