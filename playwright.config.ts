import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './e2e', // where your old tests live
  timeout: 30_000,
  use: { headless: false }, // extensions need headed mode
  // TODO enable extension
  // projects: [
  //   {
  //     name: 'chrome-with-extension',
  //     use: {
  //       ...devices['Desktop Chrome'],
  //       channel: 'chrome',
  //       launchOptions: {
  //         args: [
  //           `--disable-extensions-except=${path.join(__dirname, 'e2e/extension')}`,
  //           `--load-extension=${path.join(__dirname, 'e2e/extension')}`
  //         ]
  //       }
  //     }
  //   }
  // ]
})
