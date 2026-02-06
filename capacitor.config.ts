import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutHealth',
  webDir: 'out',
  server: {
    url: 'https://mygutcheck.app',
    allowNavigation: ['mygutcheck.app']
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com'],
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  }
};

export default config;
