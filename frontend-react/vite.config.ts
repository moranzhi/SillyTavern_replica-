import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      // 修改点：增加 '^/(?!api|assets)' 排除根路径
      // 解释：只代理以 /api 或 /assets 开头的请求
      // 其他请求（如 /）由 Vite 处理
      '^/(api|assets)': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // 如果后端路由没有 /api 前缀，需要 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  }
})
