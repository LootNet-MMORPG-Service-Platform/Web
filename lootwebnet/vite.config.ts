import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const backendTarget = process.env.VITE_API_TARGET ?? 'https://lootnet-api.onrender.com'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/hub': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
