import { supabaseAdmin } from '../supabase.js';

/**
 * Vérifie le JWT Supabase envoyé par le frontend (Authorization: Bearer <token>)
 * et attache req.user (auth) + req.profile (table profiles).
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentification requise.' });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Session invalide ou expirée.' });

    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pErr || !profile) return res.status(403).json({ error: 'Profil introuvable.' });
    if (!profile.is_active) return res.status(403).json({ error: 'Compte désactivé.' });

    req.user = data.user;
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    next();
  };
}

/** Admin : toutes les entreprises. Formateur : uniquement la sienne. */
export function canManageCompany(profile, companyId) {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return profile.role === 'trainer' && profile.company_id === companyId;
}
