import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      compiler: {
        target: '18',
      },
    }),
  ],
  build: {
    rolldownOptions: {
      external: ['@google/model-viewer'],
      onwarn(warning, defaultHandler) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message?.includes('use no memo')) {
          return;
        }
        defaultHandler(warning);
      },
    },
    rollupOptions: {
      external: ['@google/model-viewer'],
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
