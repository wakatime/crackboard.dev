import TitleBar from '@acme/ui/components/title-bar';
import type { ReactNode } from 'react';

import LeadersTabs from './tabs';

export default function LeadersTabsLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      <TitleBar bottom={<LeadersTabs />} hideBackButton title="Leaders" />
      {children}
    </main>
  );
}
