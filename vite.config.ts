import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-32.png',
        'favicon-48.png',
        'apple-touch-icon.png',
        'og-image.png',
        'og-image.jpg',
        'logo-mark.svg',
        'logo.svg',
        'pwa-192.png',
        'pwa-512.png',
        'pwa-512-maskable.png',
      ],
      manifest: {
        name: 'Priora',
        short_name: 'Priora',
        description: 'Private offline-first personal productivity system',
        theme_color: '#0a0a0a',
        background_color: '#e8e8e8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
      },
    }),
  ],
  server: {
    watch: {
      ignored: ['**/android/**', '**/ios/**'],
    },
  },
})
