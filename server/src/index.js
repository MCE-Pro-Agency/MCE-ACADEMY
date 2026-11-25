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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'mce-academy-api', time: new Date().toISOString() }));
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);

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
  // En production, les erreurs internes (500) ne détaillent pas la cause au navigateur.
  const hide = status === 500 && process.env.NODE_ENV === 'production';
  res.status(status).json({ error: hide ? 'Erreur serveur. Réessayez ou contactez MCE Academy.' : (err.message || 'Erreur serveur.') });
});

app.listen(PORT, () => {
  console.log(`✅ MCE Academy API démarrée sur http://localhost:${PORT}`);
});
