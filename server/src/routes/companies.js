import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
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
    const { data: existing } = await supabaseAdmin.from('companies').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert({ name: name.trim(), slug, sector, contact_email, max_learners: max_learners || null, logo_url })
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);

    let trainerResult = null;
    if (trainer?.email) {
      try {
        // Le formateur reçoit une invitation par e-mail et choisit lui-même son mot de passe.
        const { profile, invited } = await createAccount({
          email: trainer.email,
          full_name: trainer.full_name,
          role: 'trainer',
          company_id: company.id,
          invite: true,
        });
        trainerResult = { profile, invited };
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
    const { data: users } = await supabaseAdmin.from('profiles').select('id, role').eq('company_id', id);
    for (const u of users || []) {
      if (u.role !== 'admin') await deleteAccount(u.id);
    }
    const { error } = await supabaseAdmin.from('companies').delete().eq('id', id);
    if (error) throw new HttpError(400, error.message);
    res.json({ ok: true, deleted_users: users?.length || 0 });
  })
);

export default router;
