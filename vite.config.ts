import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3'],
          markdown: ['react-markdown', 'remark-gfm'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: true
  },
  preview: { port: 5174, host: '0.0.0.0', strictPort: true }
});


