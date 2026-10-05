import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@firebase/rules-unit-testing': path.resolve(
        __dirname,
        'node_modules/@firebase/rules-unit-testing/dist/index.cjs.js'
      ),
    },
  },
});
