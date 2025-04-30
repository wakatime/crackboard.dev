import { APP_DESC, APP_NAME, appStoreUrls } from '@acme/core/constants';
import Image from 'next/image';
import Link from 'next/link';

import { ThemeToggle } from '~/components/ThemeToggle';

interface LinkItem {
  external?: boolean;
  href: string;
  label: string;
}

interface LinkGroup {
  items: LinkItem[];
  title: string;
}

const linkGroups: LinkGroup[] = [
  {
    items: [
      {
        href: '/features',
        label: 'Features',
      },
      {
        href: '/integrations',
        label: 'Integrations',
      },
    ],
    title: 'What’s this?',
  },
  {
    items: [
      {
        href: '/privacy',
        label: 'Privacy',
      },
      {
        href: '/terms',
        label: 'Terms',
      },
    ],
    title: 'Legal',
  },
];

export default function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container grid max-w-screen-xl gap-6 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-semibold">{APP_NAME}</p>
          <p className="text-muted-foreground mt-4 leading-normal">{APP_DESC}</p>
          <p className="mt-6">
            <Link href={appStoreUrls.ios}>
              <Image alt="iOS" height={60} width={204} src="/ios-button.png" />
            </Link>
          </p>
          <p className="mt-2">
            <Link href={appStoreUrls.android}>
              <Image alt="Android" width={203} height={60} src="/android-button.png" />
            </Link>
          </p>
        </div>
        {linkGroups.map((group) => (
          <div key={group.title}>
            <p className="font-semibold">{group.title}</p>
            <ul className="mt-4 space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    className="text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container max-w-screen-xl px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between border-t py-8">
          <p className="text-muted-foreground">
            Powered by{' '}
            <Link className="hover:text-foreground font-medium underline-offset-4 hover:underline" href="https://wakatime.com">
              WakaTime
            </Link>
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
