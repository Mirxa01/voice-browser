import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests intentionally use a dedicated config instead of `vite.config.mts`.
// The build config pulls in workspace packages that are only available after
// `turbo ready` has compiled them, which would make `pnpm -F chrome-extension test`
// fail on a fresh checkout.
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(rootDir, 'src');

export default defineConfig({
  resolve: {
    alias: {
      '@root': rootDir,
      '@src': srcDir,
      '@assets': resolve(srcDir, 'assets'),
    },
  },
  define: {
    'import.meta.env.DEV': JSON.stringify(false),
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
