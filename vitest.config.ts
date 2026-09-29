import { defineConfig } from 'vitest/config';
import { webdriverio } from '@vitest/browser-webdriverio'

export default defineConfig({
  test: {
    globals: true,         // Enable global test methods like describe, it
    //environment: 'happy-dom', // or 'jsdom'
    //setupFiles: './test/setup.ts', // Include setup file
    coverage: {
      reporter: ['text', 'html'],
    },
    browser: {
      enabled: true,
      provider: webdriverio(), // https://vitest.dev/config/browser/provider
      instances: [
        {
          browser: 'firefox',
        },
      ],
    },

  },
});

