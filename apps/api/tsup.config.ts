import { defineConfig } from 'tsup';
import path from 'path';

const root = path.resolve(__dirname, '../..');

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  noExternal: [/^@saas\//],
  esbuildOptions(options) {
    options.alias = {
      '@saas/core/ws-gateway/server': `${root}/packages/core/src/ws-gateway/server.ts`,
      '@saas/core/ws-gateway/client': `${root}/packages/core/src/ws-gateway/client.ts`,
      '@saas/core/usage/tracker':     `${root}/packages/core/src/usage/tracker.ts`,
      '@saas/core/billing/usage':     `${root}/packages/core/src/billing/usage.ts`,
      '@saas/core/billing/config':    `${root}/packages/core/src/billing/config.ts`,
      '@saas/core/db/client':         `${root}/packages/core/src/db/client.ts`,
      '@saas/core/auth/clerk':        `${root}/packages/core/src/auth/clerk.ts`,
      '@saas/core':                   `${root}/packages/core/src/index.ts`,
      '@saas/shared':                 `${root}/packages/shared/src/index.ts`,
    };
  },
});
