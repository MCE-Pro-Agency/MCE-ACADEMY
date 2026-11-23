import jwt from 'jsonwebtoken';
import { one } from '../db.js';

const SECRET = process.env.JWT_SECRET || 'change-moi-en-production';
export const TOKEN_TTL = process.env.JWT_TTL || '7d';

export const signToken = (profile) => jwt.sign({ sub: profile.id, role: profile.role }, SECRET, { expiresIn: TOKEN_TTL });

export async function loadProfile(id) {
  const p = await one('SELECT * FROM profiles WHERE id = ?', [id]);
  if (p) delete p.password_hash;
  return p;
}

/** Vérifie le jeton (Authorization: Bearer <token>) et attache req.profile */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentification requise.' });
    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch {
      return res.status(401).json({ error: 'Session invalide ou expirée. Reconnectez-vous.' });
    }
    const profile = await loadProfile(payload.sub);
    if (!profile) return res.status(401).json({ error: 'Compte introuvable.' });
    if (!profile.is_active) return res.status(403).json({ error: 'Compte désactivé. Contactez votre formateur.' });
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) return res.status(403).json({ error: 'Accès refusé.' });
    next();
  };
}

export { canManageCompany } from '../policies.js';
