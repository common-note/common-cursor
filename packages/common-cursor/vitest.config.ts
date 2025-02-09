// import { defineConfig } from 'vitest/config';
import { defineProject } from 'vitest/config';

export default defineProject({
  // Configure Vitest (https://vitest.dev/config/)
  test: {
    environment: 'jsdom',
  },
});
