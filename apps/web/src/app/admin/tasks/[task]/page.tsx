import TitleBar from '@workspace/ui/components/title-bar';

import Breadcrumbs from '~/components/Breadcrumbs';

import TaskDetails from './_components/task-details';

interface Props {
  params: Promise<{
    task: string;
  }>;
}

export default async function TaskPage({ params }: Props) {
  const { task } = await params;
  return (
    <main>
      <TitleBar
        hideBackButton
        title={
          <Breadcrumbs
            items={[
              { type: 'link', href: '/admin/tasks', label: 'Background Tasks' },
              { type: 'page', label: task },
            ]}
          />
        }
      />
      <TaskDetails task={task} />
    </main>
  );
}
