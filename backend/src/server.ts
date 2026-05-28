import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';

const app = express();

// 1. Sécurité headers
app.use(helmet());

// 2. CORS (avant rate limit)
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));

// 3. Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans 1 minute.' },
}));

// 4. Parse JSON
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV });
});

app.listen(config.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${config.PORT}`);
});
