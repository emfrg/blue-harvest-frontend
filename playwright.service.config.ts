import { defineConfig } from "@playwright/test"
import config from "./playwright.config"

// These read-only checks require the separate backend to be running.
export default defineConfig({
  ...config,
  testDir: "./tests/service",
  testIgnore: [],
  outputDir: "test-results/service",
  use: { ...config.use, baseURL: "http://127.0.0.1:3101" },
  webServer: {
    command: "npm run start -- --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
  },
})
