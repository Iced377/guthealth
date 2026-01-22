
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutCheck',
  plugins: {
    "CapacitorCookies": {
      "enabled": true
    }
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'gutcheck',
    url: 'https://mygutcheck.app',
  }
};

export default config;
