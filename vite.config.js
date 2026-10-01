import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const target = env.VITE_MOCK_API_URL || 'http://localhost:4000';

  // /img нужен вместе с /api: image_url приходит относительным (/img/<id>.jpg).
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/img': { target, changeOrigin: true },
  };

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
    test: {
      include: ['src/**/*.test.js'],
    },
  };
});
