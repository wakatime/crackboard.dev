import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import TitleBar from '@workspace/ui/components/title-bar';

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
