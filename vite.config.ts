import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio preview iframe/cloud proxy to prevent WebSocket connection failures
      hmr: false,
      watch: null,
    },
  };
});

