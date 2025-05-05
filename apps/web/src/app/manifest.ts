import { APP_DESC, APP_DOMAIN } from '@workspace/core/constants';
import type { MetadataRoute } from 'next';

// https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps#creating-a-pwa-with-nextjs
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_DOMAIN,
    description: APP_DESC,
    start_url: '/',
    categories: ['social', 'dev', 'programming'],
    scope: '/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: [
      {
        src: '/icon-default-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-default-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        src: '/icon-default-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        src: '/icon-default-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    related_applications: [],
  };
}
