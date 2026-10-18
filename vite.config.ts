import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        // libraries change rarely, so they're cached separately from Xanadu's own code
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // phone notifications: push and tap handlers live in public/push-sw.js
      workbox: { importScripts: ['push-sw.js'], navigateFallbackDenylist: [/^\/push-sw\.js$/] },
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
