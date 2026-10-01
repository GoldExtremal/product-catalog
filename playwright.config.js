import { defineConfig, devices } from '@playwright/test';

const MOCK_API_URL = 'http://localhost:4000';
const APP_URL = 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  // /__chaos и /__reset меняют глобальное состояние mock API — тесты строго по очереди.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node mock-api/server.js',
      url: `${MOCK_API_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Тесты идут на production-сборке через vite preview с тем же proxy /api и /img.
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
