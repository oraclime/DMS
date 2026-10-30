import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = typeof import.meta.dirname === 'string'
  ? import.meta.dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks(id: string) {
            const normId = id.replace(/\\/g, '/');
            if (normId.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (normId.includes('node_modules/jspdf')) {
              return 'vendor-jspdf';
            }
            if (normId.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (
              normId.includes('node_modules/react') ||
              normId.includes('node_modules/scheduler') ||
              normId.includes('node_modules/motion') ||
              normId.includes('node_modules/framer-motion')
            ) {
              return 'vendor-react';
            }
            if (normId.includes('node_modules')) {
              return 'vendor-libs';
            }
            if (normId.includes('oraclimeOfficialLogo')) {
              return 'branding-assets';
            }
            if (normId.includes('/src/services/')) {
              return 'app-services';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

