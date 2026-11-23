import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // en dev, /api est redirigé vers le serveur Node.js
      '/api': 'http://localhost:4000',
      // fichiers envoyés (couvertures, documents, rendus)
      '/uploads': 'http://localhost:4000',
    },
  },
});
