import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://198.251.88.32',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'ulendopay.malawihire.com',
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Function-style chunking for Vite 8/Rolldown compatibility
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue-i18n')) return 'i18n'
            if (id.includes('axios')) return 'http'
            return 'vendor'
          }
        },
      },
    },
  },
})
