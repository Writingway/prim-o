import { defineConfig } from 'vitest/config';

// Env factice : config.ts (zod) exige ces variables à l'import. Les tests
// unitaires ne touchent ni la DB ni Stripe — valeurs de forme uniquement.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'unit-test-secret-0123456789abcdef0123456789abcdef',
      STRIPE_SECRET_KEY: 'sk_test_unit',
      STRIPE_WEBHOOK_SECRET: 'whsec_unit',
    },
  },
});
