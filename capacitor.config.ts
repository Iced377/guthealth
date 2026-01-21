
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutCheck',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "960636731129-m5ie0qkjfpmak5524v76pdko845masg5.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    "CapacitorCookies": {
      "enabled": true
    }
  },
  server: {
    androidScheme: 'https',
    url: 'http://localhost:3000',
    cleartext: true,
  }
};

export default config;
