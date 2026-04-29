import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:23337',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/store': '/src/Store',
      '@/utils': '/src/utils',
      '@/types': '/src/types',
      '@/services': '/src/services',
    }
  }
})
