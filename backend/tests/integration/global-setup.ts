import 'dotenv/config';
import { execSync } from 'child_process';

// Avant TOUS les tests d'intégration : reset complet du schéma sur la base
// de test `primo_test` (créée si absente) puis seed standard. Idempotent.
export default function setup(): void {
  const testUrl = new URL(process.env.DATABASE_URL ?? '');
  testUrl.pathname = '/primo_test';
  const env = { ...process.env, DATABASE_URL: testUrl.toString() };

  execSync('npx prisma db push --force-reset --skip-generate', { env, stdio: 'inherit' });
  execSync('npx prisma db seed', { env, stdio: 'inherit' });
}
