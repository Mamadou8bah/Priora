import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.priora.productivity',
  appName: 'Priora',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_priora',
      iconColor: '#0a0a0a',
    },
  },
}

export default config
