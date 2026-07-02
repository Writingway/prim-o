import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config';
import { UPLOADS_DIR } from './lib/upload';
import { errorHandler } from './middleware/error.middleware';
import authRouter from './routes/auth.routes';
import employeeRouter from './routes/employee.routes';
import attributionRouter from './routes/attribution.routes';
import motifRouter from './routes/motif.routes';
import cookieParser from 'cookie-parser';
import inviteRouter from './routes/invite.routes';
import offerRouter from './routes/offer.routes';
import companyRouter from './routes/company.routes';
import statsRouter from './routes/stats.routes';

import adminRouter from './routes/admin.routes';
import privacyRouter from './routes/privacy.routes';
import { requireAuth, requireAdmin } from './middleware/auth.middleware';
import { startTokenCleanup } from './jobs/tokenCleanup';
import { startInactiveAccountCleanup } from './jobs/inactiveAccountCleanup';

import stripeRouter from './routes/stripe.routes';
import { stripeWebhookController } from './controllers/stripeWebhook.controller';


const app = express();

// Authenticated dynamic API: disable ETags so responses are never 304 (a 304 breaks the client
// fetch wrapper: res.ok is false and the body is empty).
app.set('etag', false);

if (config.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
// CORS is registered before the rate limiter so throttled responses still carry CORS headers.
app.use(cors({origin: config.CLIENT_URL, credentials: true}));
// Global DoS guard, deliberately loose. Sensitive routes (login, refresh, code generation)
// have their own tight budgets in lib/rateLimit.ts. This global cap must NOT strangle normal
// SPA traffic: every navigation fires /me + /offers, and a 401 → refresh → retry triples the
// calls (doubled again by StrictMode in dev).
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
}));

// Request logging: concise colored output in dev, Apache combined format in production.
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// The Stripe webhook needs the RAW body for signature verification, so it is mounted BEFORE
// express.json().
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookController);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV });
});

// Uploaded files (offer photos) served statically; public, used by the landing showcase.
// Mounted under /api/uploads so the Vite dev proxy (which only forwards /api) picks it up.
app.use('/api/uploads', express.static(UPLOADS_DIR));

app.use('/api/auth', authRouter);
app.use('/api/me', privacyRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/attributions', attributionRouter);
app.use('/api/motifs', motifRouter);
app.use('/api/invites', inviteRouter);
app.use('/api/company', companyRouter);
app.use('/api/offers', offerRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

app.use('/api/stripe', stripeRouter);


app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${config.PORT}`);
});

// Background jobs, both on a 24h cycle: dead-token purge and GDPR anonymization of
// long-inactive accounts.
startTokenCleanup();
startInactiveAccountCleanup();
