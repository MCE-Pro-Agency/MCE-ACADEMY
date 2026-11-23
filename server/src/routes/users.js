import { Router } from 'express';
import { requireAuth, requireRole, canManageCompany } from '../middleware/auth.js';
import { one, query, uuid } from '../db.js';
import { createAccount, updateAccount, deleteAccount } from '../services/accounts.js';
import { ah, HttpError, ROLES } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'trainer'));

async function loadTarget(id) {
  const data = await one('SELECT id, role, company_id, email FROM profiles WHERE id = ?', [id]);
  if (!data) throw new HttpError(404, 'Utilisateur introuvable.');
  return data;
}

/** Un formateur ne gère que les apprenants de son entreprise. */
function assertCanManageUser(actor, target) {
  if (actor.role === 'admin') return;
  if (target.role !== 'learner' || target.company_id !== actor.company_id) {
    throw new HttpError(403, 'Vous ne pouvez gérer que les apprenants de votre entreprise.');
  }
}

// POST /api/users — créer un utilisateur
router.post(
  '/',
  ah(async (req, res) => {
    const actor = req.profile;
    let { email, password, full_name, role = 'learner', company_id, job_title, course_ids = [] } = req.body || {};

    if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
    if (actor.role === 'trainer') {
      role = 'learner';
      company_id = actor.company_id;
    }
    if (role !== 'admin' && !canManageCompany(actor, company_id)) throw new HttpError(403, 'Accès refusé.');

    const { profile, password: generated } = await createAccount({ email, password, full_name, role, company_id, job_title });

    if (role === 'learner' && Array.isArray(course_ids) && course_ids.length) {
      await enrollUsers([profile.id], course_ids, company_id);
    }

    res.status(201).json({ profile, temporary_password: generated });
  })
);

// POST /api/users/import — import en masse d'apprenants (CSV parsé côté client)
router.post(
  '/import',
  ah(async (req, res) => {
    const actor = req.profile;
    const { users = [], course_ids = [] } = req.body || {};
    const company_id = actor.role === 'trainer' ? actor.company_id : req.body.company_id;

    if (!canManageCompany(actor, company_id)) throw new HttpError(403, 'Accès refusé.');
    if (!Array.isArray(users) || users.length === 0) throw new HttpError(400, 'Aucun utilisateur à importer.');
    if (users.length > 500) throw new HttpError(400, 'Maximum 500 utilisateurs par import.');

    const created = [];
    const errors = [];
    for (const u of users) {
      try {
        const { profile, password } = await createAccount({
          email: u.email,
          password: u.password,
          full_name: u.full_name,
          job_title: u.job_title,
          role: 'learner',
          company_id,
        });
        created.push({ id: profile.id, email: profile.email, full_name: profile.full_name, temporary_password: password });
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

// PATCH /api/users/:id — modifier (nom, poste, rôle, entreprise, mot de passe, activation)
router.patch(
  '/:id',
  ah(async (req, res) => {
    const actor = req.profile;
    const target = await loadTarget(req.params.id);
    assertCanManageUser(actor, target);

    const body = { ...req.body };
    if (actor.role !== 'admin') {
      delete body.role;
      delete body.company_id;
    }
    if (body.role && !ROLES.includes(body.role)) throw new HttpError(400, 'Rôle invalide.');
    if (target.id === actor.id && (body.role || body.is_active === false)) {
      throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre rôle ou désactiver votre compte.');
    }

    const profile = await updateAccount(target.id, body);
    res.json({ profile });
  })
);

// POST /api/users/:id/reset-password — génère un nouveau mot de passe temporaire
router.post(
  '/:id/reset-password',
  ah(async (req, res) => {
    const target = await loadTarget(req.params.id);
    assertCanManageUser(req.profile, target);
    const { generatePassword } = await import('../utils.js');
    const password = req.body?.password || generatePassword();
    await updateAccount(target.id, { password });
    res.json({ temporary_password: req.body?.password ? null : password });
  })
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  ah(async (req, res) => {
    const target = await loadTarget(req.params.id);
    assertCanManageUser(req.profile, target);
    if (target.id === req.profile.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte.');
    await deleteAccount(target.id);
    res.json({ ok: true });
  })
);

async function enrollUsers(userIds, courseIds, companyId) {
  // on ne garde que les cours de l'entreprise
  const courses = courseIds.length ? await query('SELECT id FROM courses WHERE id IN (?) AND company_id = ?', [courseIds, companyId]) : [];
  for (const u of userIds) {
    for (const c of courses) await query('INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)', [uuid(), u, c.id]);
  }
}

export default router;
