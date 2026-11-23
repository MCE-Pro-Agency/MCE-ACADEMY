import bcrypt from 'bcryptjs';
import { one, query, uuid } from '../db.js';
import { loadProfile } from '../middleware/auth.js';
import { generatePassword, HttpError, isEmail, ROLES } from '../utils.js';

/** Crée un compte (profil + mot de passe chiffré). Renvoie le mot de passe généré si aucun n'était fourni. */
export async function createAccount({ email, password, full_name, role = 'learner', company_id = null, job_title = null }) {
  if (!isEmail(email)) throw new HttpError(400, `Email invalide : ${email}`);
  if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
  if (role !== 'admin' && !company_id) throw new HttpError(400, 'Une entreprise est requise pour ce rôle.');

  const cleanEmail = email.trim().toLowerCase();
  if (await one('SELECT id FROM profiles WHERE email = ?', [cleanEmail])) throw new HttpError(400, `Un compte existe déjà avec l'email ${cleanEmail}.`);

  const provided = password && password.length >= 8;
  const finalPassword = provided ? password : generatePassword();
  const id = uuid();
  await query(
    'INSERT INTO profiles (id, email, password_hash, full_name, role, company_id, job_title, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [id, cleanEmail, await bcrypt.hash(finalPassword, 10), full_name || cleanEmail.split('@')[0], role, role === 'admin' ? null : company_id, job_title || null]
  );
  return { profile: await loadProfile(id), password: provided ? null : finalPassword };
}

export async function updateAccount(userId, { email, password, full_name, role, company_id, job_title, is_active }) {
  const patch = {};
  if (email) {
    if (!isEmail(email)) throw new HttpError(400, 'Email invalide.');
    patch.email = email.trim().toLowerCase();
    const other = await one('SELECT id FROM profiles WHERE email = ? AND id <> ?', [patch.email, userId]);
    if (other) throw new HttpError(400, 'Cet email est déjà utilisé.');
  }
  if (password) {
    if (password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    patch.password_hash = await bcrypt.hash(password, 10);
  }
  if (full_name !== undefined) patch.full_name = full_name;
  if (job_title !== undefined) patch.job_title = job_title;
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.');
    patch.role = role;
  }
  if (company_id !== undefined || role === 'admin') patch.company_id = (role ?? null) === 'admin' ? null : company_id ?? null;
  if (typeof is_active === 'boolean') patch.is_active = Number(is_active);
  if (Object.keys(patch).length) await query('UPDATE profiles SET ? WHERE id = ?', [patch, userId]);
  return loadProfile(userId);
}

export async function deleteAccount(userId) {
  await query('DELETE FROM profiles WHERE id = ?', [userId]);
}
