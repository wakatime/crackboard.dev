import TitleBar from '@acme/ui/components/title-bar';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';

import Breadcrumbs from '~/components/Breadcrumbs';

import UsersList from './_components/users-list';

export default function UsersPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ type: 'page', label: 'Users' }]} />} leading={<SidebarTrigger />} />
      <UsersList />
    </main>
  );
}
