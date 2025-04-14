import { APP_DESC, APP_NAME, BASE_URL } from '@acme/core/constants';
import CustomLink from '@acme/ui/components/CustomLink';
import type { Metadata } from 'next';

import { FeaturesGrid } from './_components/features-grid';
import Typewriter from './_components/typewriter';

export const metadata: Metadata = {
  description: APP_DESC,
  title: APP_NAME,
  applicationName: APP_NAME,
  icons: [
    {
      url: `${BASE_URL}/android-chrome-512x512.png`,
      sizes: '512x512',
    },
  ],
  openGraph: {
    title: APP_NAME,
    description: APP_DESC,
    url: BASE_URL,
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    site: '@WakaTime',
    title: APP_NAME,
    description: APP_DESC,
    images: `${BASE_URL}/android-chrome-512x512.png`,
  },
};

const names = ['your-name', 'ferris', 'karen', 'marty', 'jane', 'your-name'];

export default function LandingPage() {
  return (
    <main>
      <section className="container my-32 max-w-screen-lg px-4 md:px-8" id="hero">
        <h1 className="from-foreground to-foreground/70 bg-gradient-to-br bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl">
          {APP_DESC}
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-center font-medium md:text-lg">
          wonderful.dev/
          <Typewriter width="94px" words={names} />
        </p>
        <div className="mt-8 flex w-full flex-col items-center">
          <CustomLink
            className="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring mt-2 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium shadow-md transition-colors hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            href="/login"
            prefetch={false}
          >
            Claim Your Profile
          </CustomLink>
        </div>
      </section>
      <section className="my-32">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <FeaturesGrid />
        </div>
      </section>
    </main>
  );
}
