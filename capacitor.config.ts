import type { CapacitorConfig } from '@capacitor/cli';

const remoteServerUrl =
    process.env.CAPACITOR_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
    appId: 'com.lole.device',
    appName: 'lole Device Shell',
    // Capacitor requires a local web bundle with an index.html entrypoint.
    // The native shell assets are a branded bootstrap while we wire the full App Router bundle.
    webDir: 'native-shell',
    server: remoteServerUrl
        ? {
              url: remoteServerUrl,
              cleartext: remoteServerUrl.startsWith('http://'),
              androidScheme: remoteServerUrl.startsWith('http://') ? 'http' : 'https',
          }
        : {
              androidScheme: 'https',
          },
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
        },
    },
};

export default config;
