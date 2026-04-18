import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
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
  // The server block bypassing CORS errors
  server: {
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:7124', // Updated to your actual backend port!
        changeOrigin: true,
        secure: false,
      }
    }
  }
})