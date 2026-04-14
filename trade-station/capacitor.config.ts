import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.greencandle.app',
  appName: 'GreenCandle',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For testing on a real device connected to your WiFi,
    // uncomment the line below and replace with your PC's local IP:
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#030303',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#030303',
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
