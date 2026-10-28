const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.cjs",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1440, height: 1100 },
    launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {},
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
