import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4200', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
