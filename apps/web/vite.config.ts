import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // packages/shared compiles to CommonJS (apps/api needs it that way), and a
  // linked workspace package is otherwise served straight to the browser as
  // source — so its runtime exports have to be pre-bundled into ESM first.
  optimizeDeps: {
    include: ['@wod-engine/shared'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
