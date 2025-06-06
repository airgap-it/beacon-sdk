import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration for all available options.
 */
export default defineConfig({
  // 1. Directory where your tests are located
  testDir: './e2e',

  // 2. Timeout per test (in milliseconds)
  timeout: 120_000, // 2 minutes

  // 3. Timeout for expect(...) assertions
  expect: {
    timeout: 30_000 // 30 seconds
  },

  // 4. Retries (CI: retry once; locally: no retries)
  retries: 1,

  // 6. Global “use” options for all tests
  use: {
    // a) Run all tests in headless mode by default
    headless: true,

    // c) Always capture video (only keep video when a test fails)
    video: 'retain-on-failure',

    // d) Take screenshot only on failure
    screenshot: 'only-on-failure',

    // e) Enable tracing on failure (creates trace.zip for `npx playwright show-trace ...`)
    trace: 'retain-on-failure',

    // f) Viewport size
    viewport: { width: 1280, height: 720 },

    // g) Ignore HTTPS errors (self-signed certs, etc.)
    ignoreHTTPSErrors: true
  },

  // 7. Define multiple “projects” (i.e. run tests against different browsers/devices)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox']
    //   }
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari']
    //   }
    // }

    // Example: add a mobile-emulation project
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },
  ],

  // 8. Reporter(s)—console “list” plus HTML report output under “playwright-report/”
  reporter: [
    ['list'], // simple console output
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ]
})
