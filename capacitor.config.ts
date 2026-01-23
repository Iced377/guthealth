import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iced377.guthealth',
  appName: 'GutHealth',
  webDir: 'out',
  server: {
    url: 'https://mygutcheck.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
      iosClientId: '960636731129-m5ie0qkjfpmak5524v76pdko845masg5.apps.googleusercontent.com',
      serverClientId: '960636731129-o46tlsj5e5bfk3escgq0hh3c0ss2sob5.apps.googleusercontent.com'
    }
  }
};

export default config;
