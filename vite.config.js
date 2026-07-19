import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://jhartc4x.github.io/Classroom/ in production, so the built
// assets need the '/Classroom/' base. Local dev stays at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Classroom/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Ms. Ambrogio's Classroom",
        short_name: "Ms. A's Class",
        description: 'Whimsical classroom companion — timers, quick logs, reminders, and student radar.',
        theme_color: '#fdf8ef',
        background_color: '#fdf8ef',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
}))
