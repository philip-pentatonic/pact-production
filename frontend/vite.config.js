import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || 5173),
    strictPort: false,
    proxy: {
      // Proxy API requests to the Cloudflare Worker running on port 8787
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html') 
    }
  }
}); 