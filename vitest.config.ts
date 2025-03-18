import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,         // Enable global test methods like describe, it
    //environment: 'happy-dom', // or 'jsdom'
    //setupFiles: './test/setup.ts', // Include setup file
    coverage: {
      reporter: ['text', 'html'],
    },
    browser: {
      provider: "webdriverio", //'playwright', // or 'webdriverio'
      enabled: true,
      name: 'firefox', // browser name is required
    },

  },
});

