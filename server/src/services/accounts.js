import { supabaseAdmin } from '../supabase.js';
import { generatePassword, HttpError, isEmail, ROLES } from '../utils.js';

/** Adresse du site vers laquelle pointent les liens des e-mails (invitation, réinitialisation). */
export function appUrl() {
  const url = process.env.APP_URL || (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
  return url.trim().replace(/\/+$/, '');
}

const EXISTS = /already|registered|exists/i;
const MAIL = /email|smtp|mail|rate limit/i;

function authError(error, cleanEmail) {
  if (EXISTS.test(error.message)) return new HttpError(409, `Un compte existe déjà avec l'email ${cleanEmail}.`);
  if (MAIL.test(error.message)) {
    return new HttpError(502, `L'e-mail d'invitation n'a pas pu être envoyé à ${cleanEmail}. Vérifiez la configuration SMTP de Supabase (voir docs/AUTHENTIFICATION.md).`);
  }
  return new HttpError(400, error.message);
}

/**
 * Crée un compte Supabase Auth + profil.
 * Le rôle et l'entreprise sont stockés dans app_metadata (non modifiable par l'utilisateur).
 *
 * Par défaut, le compte est créé par INVITATION : Supabase envoie un e-mail avec un lien personnel,
 * la personne confirme ainsi son adresse et choisit elle-même son mot de passe (page /activer).
 * Le mode « mot de passe » (password fourni) reste réservé aux scripts internes (seed) : l'adresse
 * y est alors marquée confirmée sans action du destinataire.
 */
export async function createAccount({ email, password, full_name, role = 'learner', company_id = null, job_title = null, invite = true }) {
  if (!isEmail(email)) throw new HttpError(400, `Email invalide : ${email}`);
  if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
  if (role !== 'admin' && !company_id) throw new HttpError(400, 'Une entreprise est requise pour ce rôle.');

  const cleanEmail = email.trim().toLowerCase();
  const name = (full_name || '').trim() || cleanEmail.split('@')[0];
  const appMetadata = { role, company_id: role === 'admin' ? null : company_id };
  let userId;
  let finalPassword = null;

  if (invite) {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
      // mce_invite : indique au trigger SQL handle_new_user (005) que le compte vient de l'API.
      data: { full_name: name, mce_invite: '1' },
      redirectTo: `${appUrl()}/activer`,
    });
    if (error) throw authError(error, cleanEmail);
    userId = data.user.id;
    // Le rôle et l'entreprise sont posés côté serveur uniquement (app_metadata).
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: appMetadata });
    if (metaError) throw new HttpError(500, `Invitation envoyée, mais rôle non enregistré : ${metaError.message}`);
  } else {
    finalPassword = password && password.length >= 8 ? password : generatePassword();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { full_name: name },
      app_metadata: appMetadata,
    });
    if (error) throw authError(error, cleanEmail);
    userId = data.user.id;
  }
  full_name = name;
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

  return {
    profile,
    invited: invite,
    password: invite || (password && password.length >= 8) ? null : finalPassword,
  };
}

/** Renvoie l'e-mail d'invitation à un compte dont l'adresse n'est pas encore confirmée. */
export async function resendInvitation(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) throw new HttpError(404, 'Compte de connexion introuvable.');
  const user = data.user;
  if (user.email_confirmed_at) throw new HttpError(409, 'Ce compte est déjà activé : utilisez plutôt « Mot de passe oublié ».');
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.email, {
    data: { full_name: user.user_metadata?.full_name, mce_invite: '1' },
    redirectTo: `${appUrl()}/activer`,
  });
  if (inviteError) throw authError(inviteError, user.email);
}

/** Envoie un e-mail de réinitialisation : la personne choisit elle-même son nouveau mot de passe. */
export async function sendPasswordReset(email) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl()}/reinitialiser` });
  if (error) throw authError(error, email);
}

/**
 * Statut réel des comptes, lu dans Supabase Auth (auth.users) :
 * disabled (désactivé), invited (invitation en attente), unconfirmed (e-mail non confirmé),
 * confirmed (e-mail confirmé, jamais connecté), active (déjà connecté).
 */
export async function accountStatuses(profiles) {
  const wanted = new Map(profiles.map((p) => [p.id, p]));
  const result = {};
  for (let page = 1; wanted.size && page <= 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new HttpError(500, error.message);
    for (const u of data.users) {
      const profile = wanted.get(u.id);
      if (!profile) continue;
      const banned = u.banned_until && new Date(u.banned_until) > new Date();
      let status = 'active';
      if (!profile.is_active || banned) status = 'disabled';
      else if (!u.email_confirmed_at) status = u.invited_at ? 'invited' : 'unconfirmed';
      else if (!u.last_sign_in_at) status = 'confirmed';
      result[u.id] = { status, invited_at: u.invited_at || null, email_confirmed_at: u.email_confirmed_at || null, last_sign_in_at: u.last_sign_in_at || null };
      wanted.delete(u.id);
    }
    if (data.users.length < 1000) break;
  }
  return result;
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
