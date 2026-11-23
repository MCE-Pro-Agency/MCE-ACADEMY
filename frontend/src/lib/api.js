import { apiRequest } from './db';

/** Appel aux routes de l'API Node.js (gestion des comptes, entreprises…) avec le jeton de l'utilisateur */
export async function api(path, { method = 'GET', body } = {}) {
  const r = await apiRequest(path, { method, body });
  if (r.error) throw new Error(r.error.message);
  return r;
}
