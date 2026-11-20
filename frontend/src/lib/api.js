import { supabase } from './supabase';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Appel à l'API Node.js avec le jeton Supabase de l'utilisateur connecté */
export async function api(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Impossible de joindre le serveur MCE Academy (API Node.js). Est-il démarré ?");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}
