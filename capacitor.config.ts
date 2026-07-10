import type { CapacitorConfig } from '@capacitor/cli';

const bundledWeb = process.env.KISHIB_CAPACITOR_BUNDLED_WEB === '1';
const productionServerUrl =
  process.env.KISHIB_CAPACITOR_SERVER_URL || 'https://antiques-lens.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.kishib.app',
  appName: 'KISHIB',
  webDir: 'out',

  ...(bundledWeb
    ? {}
    : {
        server: {
          url: productionServerUrl,
          cleartext: false,
        },
      }),

  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
