import path from 'node:path'
import { defineConfig } from '@playwright/test'

const FIXTURE_DIR = path.join(__dirname, 'fixtures/kitchen-sink')
const MANIFEST_URL = `http://localhost:4000${path.join(FIXTURE_DIR, '_builds-reader/manifest.json')}`

export default defineConfig({
  timeout: 120_000,
  workers: 1,
  reporter: [['line']],
  globalSetup: './tests/e2e/globalSetup.ts',
  webServer: [
    {
      // Serves the entire filesystem from / so that manifest absolute-path
      // URLs (e.g. http://localhost:4000/Users/.../manifest.json) resolve.
      command: 'node scripts/content-server.js',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx vite --config vite.config.e2e.js',
      env: { VITE_MANIFEST_URL: MANIFEST_URL },
      url: 'http://localhost:3000',
      cwd: path.join(__dirname, '../b-ber-reader-react'),
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'cli',
      testDir: './tests/cli',
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { browserName: 'chromium' },
    },
  ],
})
