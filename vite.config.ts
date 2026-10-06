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
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'xanadu-logo.png', 'xanadu-mark.png', 'logo-static.png', 'logo-orbit-outer.png', 'logo-orbit-inner.png', 'logo-nucleus.png', 'logo-wordmark.png', 'logo-wordmark-clean.png', 'logo-emblem-light.png', 'logo-xanadu-text.png'],
      manifest: {
        name: 'Xanadu — A network for awakening places',
        short_name: 'Xanadu',
        description: 'Find retreats, trainings and guides aligned with what you seek.',
        theme_color: '#101B2C',
        background_color: '#F6F1E8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
