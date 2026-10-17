import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import routes from './routes.js';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4000);
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 }) : null;
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:8000').split(',').map(s => s.trim()), methods: ['GET','POST'], allowedHeaders: ['Content-Type','X-Admin-Token'] }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api', (req, res, next) => {
  if (!pool && req.path !== '/health') return res.status(503).json({ error: 'Database is not configured.' });
  req.db = pool;
  next();
}, routes);
app.use((err, _req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') console.error(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: status >= 500 ? 'Server error. Please try again later.' : err.message });
});
const server = app.listen(port, '0.0.0.0', () => console.log(`Samax API listening on port ${port}`));
async function shutdown() { server.close(); if (pool) await pool.end(); process.exit(0); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
