/* =====================================================================
   Accès aux données : client Supabase (base, authentification, fichiers)
   Les pages l'utilisent sous le nom `db` :
     db.from('profile_assessments').select('*')   ·   db.auth.signInWithPassword(...)
   La sécurité est assurée par les politiques RLS de Supabase (supabase/*.sql).
   ===================================================================== */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const db = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Appel à l'API Node.js (création de comptes, entreprises) avec le jeton Supabase de l'utilisateur */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const { data } = await db.auth.getSession();
  const token = data?.session?.access_token;
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { error: { message: 'Impossible de joindre le serveur MCE Academy (API Node.js). Est-il démarré ?' } };
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: { message: json.error || `Erreur ${res.status}` } };
  return json;
}

/** Envoi d'un fichier dans le bucket public « media » ; renvoie son URL publique */
export async function uploadMedia(file, folder = 'uploads') {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from('media').upload(path, file, { upsert: false });
  if (error) throw error;
  return db.storage.from('media').getPublicUrl(path).data.publicUrl;
}
