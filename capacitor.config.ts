import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antiqueslens.app',
  appName: 'Antiques Lens',
  webDir: 'out',
  server: {
    url: 'https://antiques-lens.vercel.app',
    cleartext: false,
  },
};

export default config;