import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutHealth',
  webDir: 'out',
  server: {
    url: 'https://mygutcheck.app',
    cleartext: false
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    }
  }
};

export default config;
