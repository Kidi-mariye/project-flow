import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output the production build into Laravel's public directory so the
    // backend can serve the SPA directly in production (see routes/web.php).
    // outDir is outside the Vite root, so emptyOutDir stays disabled and
    // Laravel's own public files (index.php, .htaccess) are preserved.
    outDir: '../backend/public',
  },
  server: {
    proxy: {
      // Proxy API requests during development to the backend server
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
