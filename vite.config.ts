import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Fallback riwayat untuk pengembangan lokal: route per halaman di bawah
// /app/<halaman> harus dilayani app/index.html (di produksi Vercel,
// aturan yang sama ada di vercel.json -> rewrites).
function appHistoryFallback(): Plugin {
  return {
    name: 'rekammedis-app-history-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url || '').split('?')[0]
        if (
          url.startsWith('/app/') &&
          url !== '/app/' &&
          !url.includes('.') &&
          (req.headers.accept || '').includes('text/html')
        ) {
          req.url = '/app/index.html'
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appHistoryFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        app: resolve(process.cwd(), 'app/index.html'),
      },
    },
  },
})
