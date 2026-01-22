
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutCheck',
  plugins: {
    "CapacitorCookies": {
      "enabled": true
    },
    "GoogleAuth": {
      "scopes": ["profile", "email"],
      "serverClientId": "960636731129-m5ie0qkjfpmak5524v76pdko845masg5.apps.googleusercontent.com",
      "forceCodeForRefreshToken": true
    }
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'gutcheck',
    url: 'https://mygutcheck.app',
  }
};

export default config;
