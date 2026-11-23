import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { one, query } from '../db.js';
import { requireAuth, signToken, loadProfile } from '../middleware/auth.js';
import { ah, HttpError } from '../utils.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' } });

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  ah(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const row = await one('SELECT * FROM profiles WHERE email = ?', [email]);
    if (!row || !(await bcrypt.compare(password, row.password_hash))) throw new HttpError(401, 'Email ou mot de passe incorrect.');
    if (!row.is_active) throw new HttpError(403, 'Votre compte est désactivé. Contactez votre formateur.');
    const profile = await loadProfile(row.id);
    res.json({ token: signToken(profile), user: profile });
  })
);

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.profile }));

// POST /api/auth/password — changer son propre mot de passe
router.post(
  '/password',
  requireAuth,
  ah(async (req, res) => {
    const { password } = req.body || {};
    if (!password || password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    await query('UPDATE profiles SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.profile.id]);
    res.json({ ok: true });
  })
);

export default router;
