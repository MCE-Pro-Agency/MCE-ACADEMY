import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole, canManageCompany } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import {
  createAccount, updateAccount, deleteAccount, resendInvitation, sendPasswordReset, accountStatuses,
} from '../services/accounts.js';
import { ah, HttpError, ROLES } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'trainer'));

// Les routes qui envoient des e-mails sont limitées pour éviter les abus (et le blocage SMTP).
const mailLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.profile?.id || req.ip,
  message: { error: 'Trop d’e-mails envoyés en peu de temps. Réessayez dans quelques minutes.' },
});

async function loadTarget(id) {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
  if (error || !data) throw new HttpError(404, 'Utilisateur introuvable.');
  return data;
}

/**
 * Admin : tous les comptes.
 * Formateur : uniquement les apprenants des entreprises qu'il gère.
 */
async function assertCanManageUser(actor, target) {
  if (actor.role === 'admin') return;
  if (target.role !== 'learner' || !(await canManageCompany(actor, target.company_id))) {
    throw new HttpError(403, 'Vous ne pouvez gérer que les apprenants de vos entreprises.');
  }
}

// GET /api/users/status — statut réel des comptes (invitation, confirmation, activité)
router.get(
  '/status',
  ah(async (req, res) => {
    const actor = req.profile;
    let query = supabaseAdmin.from('profiles').select('id, role, company_id, is_active');
    if (req.query.company_id) query = query.eq('company_id', req.query.company_id);
    const { data: profiles, error } = await query;
    if (error) throw new HttpError(500, error.message);
    const visible = [];
    for (const p of profiles || []) {
      if (actor.role === 'admin' || (p.role === 'learner' && await canManageCompany(actor, p.company_id))) visible.push(p);
    }
    res.json({ statuses: await accountStatuses(visible) });
  })
);

// POST /api/users — créer un utilisateur (invitation par e-mail)
router.post(
  '/',
  mailLimiter,
  ah(async (req, res) => {
    const actor = req.profile;
    let { email, full_name, role = 'learner', company_id, job_title, course_ids = [] } = req.body || {};

    if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
    if (actor.role === 'trainer') {
      role = 'learner';
      company_id = company_id || actor.company_id;
    }
    if (role !== 'admin' && !(await canManageCompany(actor, company_id))) throw new HttpError(403, 'Accès refusé.');

    const { profile, invited } = await createAccount({ email, full_name, role, company_id, job_title, invite: true });

    if (role === 'learner' && Array.isArray(course_ids) && course_ids.length) {
      await enrollUsers([profile.id], course_ids, company_id);
    }

    res.status(201).json({ profile, invited });
  })
);

// POST /api/users/import — import en masse d'apprenants (CSV parsé côté client), par invitation
router.post(
  '/import',
  ah(async (req, res) => {
    const actor = req.profile;
    const { users = [], course_ids = [] } = req.body || {};
    const company_id = actor.role === 'trainer' ? (req.body.company_id || actor.company_id) : req.body.company_id;

    if (!(await canManageCompany(actor, company_id))) throw new HttpError(403, 'Accès refusé.');
    if (!Array.isArray(users) || users.length === 0) throw new HttpError(400, 'Aucun utilisateur à importer.');
    if (users.length > 500) throw new HttpError(400, 'Maximum 500 utilisateurs par import.');

    const created = [];
    const errors = [];
    const seen = new Set();
    for (const u of users) {
      const key = String(u.email || '').trim().toLowerCase();
      if (seen.has(key)) { errors.push({ email: u.email, error: 'Adresse présente plusieurs fois dans le fichier.' }); continue; }
      seen.add(key);
      try {
        const { profile } = await createAccount({
          email: u.email,
          full_name: u.full_name,
          job_title: u.job_title,
          role: 'learner',
          company_id,
          invite: true,
        });
        created.push({ id: profile.id, email: profile.email, full_name: profile.full_name, invited: true });
      } catch (e) {
        errors.push({ email: u.email, error: e.message });
      }
    }

    if (created.length && course_ids.length) {
      await enrollUsers(created.map((c) => c.id), course_ids, company_id);
    }

    res.json({ created, errors });
  })
);

// POST /api/users/:id/invite — renvoyer l'invitation (adresse pas encore confirmée)
router.post(
  '/:id/invite',
  mailLimiter,
  ah(async (req, res) => {
    const target = await loadTarget(req.params.id);
    await assertCanManageUser(req.profile, target);
    await resendInvitation(target.id);
    res.json({ ok: true });
  })
);

// PATCH /api/users/:id — modifier (nom, poste, rôle, entreprise, activation)
router.patch(
  '/:id',
  ah(async (req, res) => {
    const actor = req.profile;
    const target = await loadTarget(req.params.id);
    await assertCanManageUser(actor, target);

    // Les mots de passe ne sont plus définis par un tiers : la personne les choisit via un lien e-mail.
    const { password: _ignored, ...body } = req.body || {};
    if (actor.role !== 'admin') {
      delete body.role;
      delete body.company_id;
      delete body.email;
    }
    if (body.role && !ROLES.includes(body.role)) throw new HttpError(400, 'Rôle invalide.');
    if (body.company_id && actor.role === 'admin' && !(await canManageCompany(actor, body.company_id))) throw new HttpError(403, 'Accès refusé.');
    if (target.id === actor.id && (body.role || body.is_active === false)) {
      throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre rôle ou désactiver votre compte.');
    }

    const profile = await updateAccount(target.id, body);
    res.json({ profile });
  })
);

// POST /api/users/:id/reset-password — envoie un e-mail de réinitialisation du mot de passe
router.post(
  '/:id/reset-password',
  mailLimiter,
  ah(async (req, res) => {
    const target = await loadTarget(req.params.id);
    await assertCanManageUser(req.profile, target);
    await sendPasswordReset(target.email);
    res.json({ sent: true });
  })
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  ah(async (req, res) => {
    const target = await loadTarget(req.params.id);
    await assertCanManageUser(req.profile, target);
    if (target.id === req.profile.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte.');
    await deleteAccount(target.id);
    res.json({ ok: true });
  })
);

async function enrollUsers(userIds, courseIds, companyId) {
  // on ne garde que les cours de l'entreprise
  const { data: courses } = await supabaseAdmin.from('courses').select('id').in('id', courseIds).eq('company_id', companyId);
  const rows = [];
  for (const u of userIds) for (const c of courses || []) rows.push({ user_id: u, course_id: c.id });
  if (rows.length) {
    await supabaseAdmin.from('enrollments').upsert(rows, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  }
}

export default router;
