import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middlewares ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Rate limiting global : 30 req/min/IP
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans une minute.' },
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

// TODO Sprint 1 : importer les routes ici
// import authRoutes from './routes/auth.routes.js';
// app.use('/api/auth', authRoutes);

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Prim'O API démarrée sur http://localhost:${PORT}`);
});

export default app;
