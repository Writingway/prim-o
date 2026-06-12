import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import authRouter from './routes/auth.routes';
import employeeRouter from './routes/employee.routes';
import attributionRouter from './routes/attribution.routes';
import cookieParser from 'cookie-parser';
import inviteRouter from './routes/invite.routes';
import offerRouter from './routes/offer.routes';
import companyRouter from './routes/company.routes';
import adminRouter from './routes/admin.routes';
import { requireAuth, requireAdmin } from './middleware/auth.middleware';
import { startTokenCleanup } from './jobs/tokenCleanup';


const app = express();

// API dynamique authentifiée : pas d'ETag → pas de 304 (qui casse fetch,
// res.ok devenant false et le body vide côté client).
app.set('etag', false);

if (config.NODE_ENV === 'production') app.set('trust proxy', 1);

// 1. Sécurité headers
app.use(helmet());
// 2. CORS (avant rate limit)
app.use(cors({origin: config.CLIENT_URL, credentials: true}));
// 3. Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
}));
// En dev : logs détaillés colorés
// En prod : format court (économise les logs)
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
// 4. Parse JSON
app.use(express.json());
// Parser cookies
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV });
});

app.use('/api/auth', authRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/attributions', attributionRouter);
app.use('/api/invites', inviteRouter);
app.use('/api/company', companyRouter);
app.use('/api/offers', offerRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${config.PORT}`);
});

// Démarre le job de nettoyage des tokens révoqués (tous les 24 heures).
startTokenCleanup();
