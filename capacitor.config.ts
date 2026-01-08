import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gutcheck.app',
  appName: 'GutCheck',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://mygutcheck.app/',
    // cleartext: true, // Use this if you want to test with a local server (http://localhost:3000)
  }
};

export default config;
