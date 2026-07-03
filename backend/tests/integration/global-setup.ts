import 'dotenv/config';
import { execSync } from 'child_process';

// Before ALL integration tests: full schema reset on the test database
// `primo_test` (created if missing) then standard seed. Idempotent.
export default function setup(): void {
  const testUrl = new URL(process.env.DATABASE_URL ?? '');
  testUrl.pathname = '/primo_test';
  const env = { ...process.env, DATABASE_URL: testUrl.toString() };

  execSync('npx prisma db push --force-reset --skip-generate', { env, stdio: 'inherit' });
  execSync('npx prisma db seed', { env, stdio: 'inherit' });
}
