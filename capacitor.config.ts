import type { CapacitorConfig } from '@capacitor/cli'

/**
 * iPhone app (Capacitor). The app ships the same React build as app.dreamxanadu.com (`dist/`),
 * so `npm run ios` rebuilds the web code and copies it into the Xcode project.
 * Bundle ID `dreamxanadu.app` is registered with Apple and must never change.
 */
const config: CapacitorConfig = {
  appId: 'dreamxanadu.app',
  appName: 'Xanadu',
  webDir: 'dist',
  backgroundColor: '#101B2C',
  ios: {
    contentInset: 'never',
    scheme: 'Xanadu',
  },
}

export default config
