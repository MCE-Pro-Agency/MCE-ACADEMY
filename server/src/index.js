import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import usersRouter from './routes/users.js';
import companiesRouter from './routes/companies.js';
import authRouter from './routes/auth.js';
import dbRouter from './routes/db.js';
import rpcRouter from './routes/rpc.js';
import uploadRouter, { UPLOAD_DIR } from './routes/upload.js';
import { pool } from './db.js';
import { loadMeta } from './query.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 1000, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'mce-academy-api', database: 'mysql', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ ok: false, error: `Base MySQL injoignable : ${e.message}` });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/db', dbRouter);
app.use('/api/rpc', rpcRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// En production : sert le frontend compilé (frontend/dist) si présent
const dist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route introuvable.' }));

// Gestion centralisée des erreurs
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Erreur serveur.' });
});

loadMeta()
  .then(() => console.log('✅ Base MySQL connectée'))
  .catch((e) => console.error(`⚠️  Base MySQL injoignable (${e.code || e.message}). Vérifiez server/.env puis lancez « npm run db:init ».`));

app.listen(PORT, () => {
  console.log(`✅ MCE Academy API démarrée sur http://localhost:${PORT}`);
});
