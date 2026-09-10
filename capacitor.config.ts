import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kamand.konkur',
  appName: 'شمارش معکوس کنکور',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#11083e'
  }
};

export default config;
