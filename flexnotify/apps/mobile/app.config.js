module.exports = {
  expo: {
    name: 'FlexNotify',
    slug: 'flexnotify',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#2563eb' },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'app.flexnotify.mobile',
      buildNumber: '1',
    },
    android: {
      package: 'app.flexnotify.mobile',
      versionCode: 1,
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#2563eb' },
      googleServicesFile: './google-services.json',
      permissions: ['NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
    },
    plugins: [
      ['expo-notifications', {
        icon: './assets/notification-icon.png',
        color: '#2563eb',
        sounds: ['./assets/notification.wav'],
        androidMode: 'default',
        androidCollapsedTitle: 'FlexNotify Blocks',
        iosDisplayInForeground: true,
      }],
      ['expo-build-properties', {
        android: { compileSdkVersion: 34, targetSdkVersion: 34 },
        ios: { deploymentTarget: '13.4' },
      }],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.flexnotify.app',
    },
  },
};
