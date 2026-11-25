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
  // Charger l'état actuel pour éviter des écritures Auth inutiles.
  const { data: current, error: currentError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, company_id, job_title, is_active')
    .eq('id', userId)
    .single();
  if (currentError || !current) throw new HttpError(404, 'Compte introuvable.');

  const normalEmail = (value) => String(value ?? '').trim().toLowerCase();
  const requestedEmail = email === undefined || email === null || email === ''
    ? undefined : normalEmail(email);
  if (requestedEmail !== undefined && !isEmail(requestedEmail)) {
    throw new HttpError(400, 'Adresse e-mail invalide.');
  }
  if (password && password.length < 8) {
    throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
  }
  if (role !== undefined && !ROLES.includes(role)) {
    throw new HttpError(400, 'Rôle invalide.');
  }

  const nextRole = role === undefined ? current.role : role;
  const nextCompany = nextRole === 'admin' ? null :
    (company_id === undefined ? current.company_id : company_id);
  if (nextRole !== 'admin' && !nextCompany) {
    throw new HttpError(400, 'Une entreprise est requise pour ce rôle.');
  }

  const roleChanged = nextRole !== current.role;
  const companyChanged = nextCompany !== current.company_id;
  const statusChanged = typeof is_active === 'boolean' && is_active !== current.is_active;
  const emailChangedInProfile = requestedEmail !== undefined && requestedEmail !== normalEmail(current.email);

  // Lire Auth uniquement lorsqu'une mise à jour Auth est possible.
  const needsAuthLookup = requestedEmail !== undefined || !!password || roleChanged || companyChanged || statusChanged;
  let authUser = null;
  if (needsAuthLookup) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      throw new HttpError(400, `Impossible de consulter le compte de connexion : ${error?.message || 'introuvable'}`);
    }
    authUser = data.user;
  }

  const authUpdate = {};
  if (requestedEmail !== undefined && requestedEmail !== normalEmail(authUser?.email)) {
    authUpdate.email = requestedEmail;
    authUpdate.email_confirm = true;
  }
  if (password) authUpdate.password = password;
  if (roleChanged || companyChanged) {
    // Préserver les métadonnées des autres fonctions de la plateforme.
    authUpdate.app_metadata = {
      ...(authUser?.app_metadata || {}),
      role: nextRole,
      company_id: nextCompany,
    };
  }
  if (statusChanged) {
    authUpdate.ban_duration = is_active ? 'none' : '876000h';
  }

  if (Object.keys(authUpdate).length) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);
    if (error) {
      throw new HttpError(400, `Mise à jour du compte de connexion impossible : ${error.message}`);
    }
  }

  const patch = {};
  if (emailChangedInProfile) patch.email = requestedEmail;
  if (full_name !== undefined && full_name !== current.full_name) patch.full_name = full_name;
  if (job_title !== undefined && job_title !== current.job_title) patch.job_title = job_title;
  if (roleChanged) patch.role = nextRole;
  if (companyChanged) patch.company_id = nextCompany;
  if (statusChanged) patch.is_active = is_active;

  if (Object.keys(patch).length) {
    const { data, error } = await supabaseAdmin
      .from('profiles').update(patch).eq('id', userId).select().single();
    if (error) {
      throw new HttpError(400, `Compte de connexion éventuellement mis à jour, mais profil non enregistré : ${error.message}`);
    }
    return data;
  }
  return current;
}

export async function deleteAccount(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new HttpError(400, error.message);
}
