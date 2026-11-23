import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { one, query, uuid } from '../db.js';
import { createAccount, deleteAccount } from '../services/accounts.js';
import { ah, HttpError, slugify } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// POST /api/companies — crée une entreprise (+ formateur référent optionnel)
router.post(
  '/',
  ah(async (req, res) => {
    const { name, sector, contact_email, max_learners, logo_url, trainer } = req.body || {};
    if (!name?.trim()) throw new HttpError(400, "Le nom de l'entreprise est requis.");

    let slug = slugify(name) || 'entreprise';
    if (await one('SELECT id FROM companies WHERE slug = ?', [slug])) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const id = uuid();
    await query('INSERT INTO companies (id, name, slug, sector, contact_email, max_learners, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id, name.trim(), slug, sector || null, contact_email || null, max_learners || null, logo_url || null,
    ]);
    const company = await one('SELECT * FROM companies WHERE id = ?', [id]);

    let trainerResult = null;
    if (trainer?.email) {
      try {
        const { profile, password } = await createAccount({
          email: trainer.email,
          password: trainer.password,
          full_name: trainer.full_name,
          role: 'trainer',
          company_id: company.id,
        });
        trainerResult = { profile, temporary_password: password };
      } catch (e) {
        trainerResult = { error: e.message };
      }
    }

    res.status(201).json({ company, trainer: trainerResult });
  })
);

// DELETE /api/companies/:id — supprime l'entreprise ET les comptes de ses utilisateurs
router.delete(
  '/:id',
  ah(async (req, res) => {
    const { id } = req.params;
    const users = await query("SELECT id FROM profiles WHERE company_id = ? AND role <> 'admin'", [id]);
    for (const u of users) await deleteAccount(u.id);
    await query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ ok: true, deleted_users: users?.length || 0 });
  })
);

export default router;
