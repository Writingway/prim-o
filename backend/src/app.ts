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
import testRouter from './routes/test.routes';
import privacyRouter from './routes/privacy.routes';
import { requireAuth, requireAdmin } from './middleware/auth.middleware';

//stripe
import stripeRouter from './routes/stripe.routes';
import { stripeWebhookController } from './controllers/stripeWebhook.controller';

// L'app Express est construite ici SANS écouter de port : server.ts
// (prod/dev) fait le listen + démarre les jobs ; les tests d'intégration
// (Supertest) importent l'app directement, sans serveur ni port.
const app = express();

// API dynamique authentifiée : pas d'ETag → pas de 304 (qui casse fetch,
// res.ok devenant false et le body vide côté client).
app.set('etag', false);

if (config.NODE_ENV === 'production') app.set('trust proxy', 1);

// 1. Sécurité headers
app.use(helmet());
// 2. CORS (avant rate limit)
app.use(cors({origin: config.CLIENT_URL, credentials: true}));
// 3. Rate limiting - garde-fou DoS GLOBAL et large. Les routes sensibles
// (login, refresh, génération de codes) ont leurs propres budgets serrés
// dans lib/rateLimit.ts. Ce plafond global ne doit PAS étrangler le trafic
// normal d'une SPA : chaque navigation déclenche /me + /offers, et un 401
// → refresh → retry triple les appels (×2 encore en StrictMode dev).
// Désactivé en test : les suites d'intégration enchaînent les requêtes.
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test',
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
}));

// En dev : logs détaillés colorés
// En prod : format court (économise les logs)
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Webhook Stripe : corps BRUT obligatoire (vérif de signature) → AVANT express.json().
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookController);

// 4. Parse JSON
app.use(express.json());
// Parser cookies
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV });
});

// Fichiers uploadés (photos d'offres) servis en statique. Public (vitrine landing).
// Sous /api/uploads pour passer par le proxy Vite en dev (qui ne route que /api).
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

//Stripe endpoints
app.use('/api/stripe', stripeRouter);

// Routes de test (auto-vérification email pour les tests d'intégration) : JAMAIS en production.
if (config.NODE_ENV !== 'production') {
  app.use('/api/test', testRouter);
}

app.use(errorHandler);

export default app;
