import TitleBar from '@acme/ui/components/title-bar';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';

import Breadcrumbs from '~/components/Breadcrumbs';

import TasksList from './_components/tasks-list';

export default function TasksPage() {
  return (
    <main>
      <TitleBar hideBackButton title={<Breadcrumbs items={[{ type: 'page', label: 'Background Tasks' }]} />} leading={<SidebarTrigger />} />
      <TasksList />
    </main>
  );
}
