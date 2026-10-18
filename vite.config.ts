import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://api.meme.skyfly.hackclub.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
      '/ws-proxy': {
        target: 'wss://realtime.meme.skyfly.hackclub.app',
        ws: true,
        changeOrigin: true,
        headers: {
          Origin: 'https://new.meme.skyfly.hackclub.app',
        },
        rewrite: (path) => path.replace(/^\/ws-proxy/, ''),
      },
    },
  },
})
