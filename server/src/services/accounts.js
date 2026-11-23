import { supabaseAdmin } from '../supabase.js';
import { generatePassword, HttpError, isEmail, ROLES } from '../utils.js';

/**
 * Crée un compte Supabase Auth + profil.
 * Le rôle et l'entreprise sont stockés dans app_metadata (non modifiable par l'utilisateur).
 */
export async function createAccount({ email, password, full_name, role = 'learner', company_id = null, job_title = null }) {
  if (!isEmail(email)) throw new HttpError(400, `Email invalide : ${email}`);
  if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
  if (role !== 'admin' && !company_id) throw new HttpError(400, 'Une entreprise est requise pour ce rôle.');

  const finalPassword = password && password.length >= 8 ? password : generatePassword();
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: finalPassword,
    email_confirm: true,
    user_metadata: { full_name: full_name || cleanEmail.split('@')[0] },
    app_metadata: { role, company_id: role === 'admin' ? null : company_id },
  });

  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? `Un compte existe déjà avec l'email ${cleanEmail}.`
      : error.message;
    throw new HttpError(400, msg);
  }

  const userId = data.user.id;
  // upsert du profil (au cas où le trigger n'aurait pas tout renseigné)
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: cleanEmail,
        full_name: full_name || cleanEmail.split('@')[0],
        role,
        company_id: role === 'admin' ? null : company_id,
        job_title,
        is_active: true,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (pErr) throw new HttpError(500, pErr.message);

  return { profile, password: password && password.length >= 8 ? null : finalPassword };
}

export async function updateAccount(userId, { email, password, full_name, role, company_id, job_title, is_active }) {
  const authUpdate = {};
  if (email) authUpdate.email = email.trim().toLowerCase();
  if (password) {
    if (password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    authUpdate.password = password;
  }
  if (role !== undefined || company_id !== undefined) {
    const { data: current } = await supabaseAdmin.from('profiles').select('role, company_id').eq('id', userId).single();
    authUpdate.app_metadata = {
      role: role ?? current?.role,
      company_id: (role ?? current?.role) === 'admin' ? null : company_id ?? current?.company_id,
    };
  }
  if (typeof is_active === 'boolean') {
    authUpdate.ban_duration = is_active ? 'none' : '876000h';
  }
  if (Object.keys(authUpdate).length) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);
    if (error) throw new HttpError(400, error.message);
  }

  const patch = {};
  if (email) patch.email = email.trim().toLowerCase();
  if (full_name !== undefined) patch.full_name = full_name;
  if (job_title !== undefined) patch.job_title = job_title;
  if (role !== undefined) patch.role = role;
  if (company_id !== undefined) patch.company_id = role === 'admin' ? null : company_id;
  if (typeof is_active === 'boolean') patch.is_active = is_active;

  if (Object.keys(patch).length) {
    const { data, error } = await supabaseAdmin.from('profiles').update(patch).eq('id', userId).select().single();
    if (error) throw new HttpError(400, error.message);
    return data;
  }
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function deleteAccount(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new HttpError(400, error.message);
}
