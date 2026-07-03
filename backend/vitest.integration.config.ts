import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Tests d'intégration : vraie app Express (Supertest) + vraie DB Postgres,
// mais sur une base DÉDIÉE `primo_test` (même instance Docker que primo).
// global-setup la recrée et la seed avant chaque run — la DB de dev n'est
// jamais touchée.
const testUrl = new URL(process.env.DATABASE_URL ?? 'postgresql://localhost:5432/primo');
testUrl.pathname = '/primo_test';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    // Fichiers en série : ils partagent la même DB seedée.
    fileParallelism: false,
    testTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testUrl.toString(),
    },
  },
});
