import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import TitleBar from '@workspace/ui/components/title-bar';

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
