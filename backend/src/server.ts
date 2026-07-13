import 'dotenv/config';
import app from './app';
import { config } from './config';
import { startTokenCleanup } from './jobs/tokenCleanup';
import { startInactiveAccountCleanup } from './jobs/inactiveAccountCleanup';

// Runtime entry point only: listen + background jobs.
// The app construction (middlewares, routes) lives in app.ts,
// importable by integration tests without opening a port.
app.listen(config.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${config.PORT}`);
});

// Start the job that cleans up revoked tokens (every 24 hours).
startTokenCleanup();

// Start the GDPR anonymization job for inactive accounts (every 24h).
startInactiveAccountCleanup();
