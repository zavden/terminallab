const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: '**/standalone.spec.cjs', fullyParallel: true,
  timeout: 90000, expect: {timeout:10000},
  use: {headless:true, viewport:{width:1440,height:1100}, reducedMotion:'reduce', screenshot:'only-on-failure'},
  projects: [
    {name:'chrome', use:{browserName:'chromium',launchOptions: process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}}},
    {name:'firefox', use:{browserName:'firefox'}},
    {name:'webkit', use:{browserName:'webkit'}},
  ],
});
