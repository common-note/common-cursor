import path from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  // Configure Vitest (https://vitest.dev/config/)
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      'common-cursor': path.resolve(__dirname, '../common-cursor/src'),
    },
  },
});
