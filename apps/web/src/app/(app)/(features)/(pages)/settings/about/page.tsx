import { APP_NAME } from '@acme/core/constants';
import SettingsMenuList from '@acme/ui/components/settings-menu-list';
import TitleBar from '@acme/ui/components/title-bar';
import type { Metadata } from 'next';
import { LuBook } from 'react-icons/lu';

export const metadata: Metadata = {
  title: `About - ${APP_NAME}`,
};

export default function Page() {
  return (
    <>
      <TitleBar title="About" />
      <SettingsMenuList
        list={[
          {
            href: '/privacy',
            icon: <LuBook />,
            name: 'Privacy Policy',
          },
          {
            href: '/terms',
            icon: <LuBook />,
            name: 'Terms of Service',
          },
        ]}
      />
      <div className="h-48"></div>
    </>
  );
}
