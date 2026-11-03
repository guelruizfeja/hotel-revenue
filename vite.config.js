import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Cada deploy se aplica solo: el SW nuevo se activa y recarga sin preguntar
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['fastrev-favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'FastRevenue',
        short_name: 'FastRevenue',
        description: 'Revenue management para hoteles',
        lang: 'es',
        // La app vive en /home; "/" es la landing comercial (ver vercel.json)
        start_url: '/home',
        scope: '/home',
        display: 'standalone',
        background_color: '#111111',
        theme_color: '#111111',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo el "esqueleto" de la app (JS/CSS del build + index.html; los iconos los añade el plugin).
        // Nada de las imágenes/vídeos pesados de la landing.
        globPatterns: ['index.html', 'assets/**/*.{js,css}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Navegaciones dentro de la app → index.html precacheado. La landing y las
        // páginas legales siguen yendo siempre a la red.
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/home/],
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Sin runtimeCaching: Supabase (datos y auth) y /api van SIEMPRE a la red.
      },
    }),
  ],
  server: {
    // Solo en desarrollo: las rutas /api las sirve `vercel dev` en el puerto 3000
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
