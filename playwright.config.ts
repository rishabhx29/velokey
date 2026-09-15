import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Run e2e against the production build: matches real deployments and
        // avoids webpack-dev-only hydration quirks on client param pages.
        command: "npm run build && npm run start -- -p 3001",
        url: baseURL,
        // Never reuse a server we didn't start — port 3001 may host a
        // different local app, which would poison every test.
        reuseExistingServer: false,
        timeout: 300_000,
      },
})
