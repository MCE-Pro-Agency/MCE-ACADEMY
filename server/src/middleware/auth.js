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

/**
 * Admin : toutes les entreprises.
 * Formateur : son entreprise principale + celles qui lui sont attribuées (table trainer_companies),
 * comme la fonction SQL public.is_trainer_of utilisée par les règles RLS.
 */
export async function canManageCompany(profile, companyId) {
  if (!profile || !companyId) return profile?.role === 'admin';
  if (profile.role === 'admin') return true;
  if (profile.role !== 'trainer' || !profile.is_active) return false;
  if (profile.company_id === companyId) return true;
  const { data, error } = await supabaseAdmin
    .from('trainer_companies')
    .select('company_id')
    .eq('trainer_id', profile.id)
    .eq('company_id', companyId)
    .maybeSingle();
  return !error && !!data;
}
