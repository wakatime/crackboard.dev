import TitleBar from '@acme/ui/components/title-bar';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';

import Breadcrumbs from '~/components/Breadcrumbs';

import PageClient from './page-client';

interface Props {
  params: Promise<{
    user: string;
  }>;
}

export default async function UserPage({ params }: Props) {
  const { user } = await params;
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { type: 'link', href: '/admin/users', label: 'Users' },
              { type: 'page', label: user },
            ]}
          />
        }
        leading={<SidebarTrigger />}
      />
      <PageClient />
    </main>
  );
}
