import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kishib.app',
  appName: 'KISHIB',
  webDir: 'out',
  server: {
    url: 'https://antiques-lens.vercel.app',
    cleartext: false,
  },
};

export default config;