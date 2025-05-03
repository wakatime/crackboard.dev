import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  version: '1.3.0',
  owner: 'wakatime_llc',
  name: 'crackedboard.dev',
  slug: 'crackboarddev',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  icon: './assets/images/icon.png',
  scheme: 'crackboard.dev',
  android: {
    userInterfaceStyle: 'automatic',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: './assets/images/adaptive-icon.png',
    },
    package: 'crackboard.dev',
    versionCode: 12,
  },
  ios: {
    userInterfaceStyle: 'automatic',
    bundleIdentifier: 'com.crackboard.app',
    config: {
      usesNonExemptEncryption: false,
    },
    supportsTablet: true,
  },
  plugins: [
    'expo-build-properties',
    'expo-font',
    'expo-web-browser',
    [
      'expo-asset',
      {
        assets: ['./assets/images/logo.png'],
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/logo.png',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/images/logo.png',
          backgroundColor: '#030711',
        },
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your friends.',
      },
    ],
  ],
  experiments: {
    // tsconfigPaths: true,
    // typedRoutes: true,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: '9365b626-f0ab-49a6-b72f-d94c702c7dfc',
    },
  },
});
