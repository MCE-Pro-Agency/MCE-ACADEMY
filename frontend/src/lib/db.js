/* =====================================================================
   Client de données MCE Academy (API Node.js + MySQL)
   Même écriture que l'ancien client Supabase :
     db.from('courses').select('*, modules(*)').eq('id', x).single()
     db.rpc('submit_quiz', {...})   ·   db.auth.signInWithPassword(...)
   Toutes les règles d'accès sont vérifiées côté serveur.
   ===================================================================== */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const SESSION_KEY = 'mce_session';
const listeners = new Set();

/* ---------------- Session ---------------- */
function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeSession(session, event) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((cb) => cb(event, session));
}
export const getToken = () => readSession()?.access_token || null;

async function request(path, { method = 'POST', body, form } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    return { error: { message: 'Impossible de joindre le serveur MCE Academy. Est-il démarré ?' } };
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && token) writeSession(null, 'SIGNED_OUT'); // session expirée → retour à la connexion
  if (!res.ok) return { error: { message: json.error || `Erreur ${res.status}`, code: json.code, status: res.status } };
  return json;
}
export { request as apiRequest };

/* ---------------- Constructeur de requêtes ---------------- */
class Query {
  constructor(table) {
    this.q = { table, action: 'select', columns: '*', filters: [], order: [] };
  }
  select(columns = '*', opts = {}) {
    if (this.q.action === 'select') {
      this.q.columns = columns;
      if (opts.count) this.q.count = true;
      if (opts.head) this.q.head = true;
    } else {
      this.q.returning = true;
      this.q.columns = columns;
    }
    return this;
  }
  _f(op, col, val) {
    this.q.filters.push({ col, op, val });
    return this;
  }
  eq(c, v) { return this._f('eq', c, v); }
  neq(c, v) { return this._f('neq', c, v); }
  gt(c, v) { return this._f('gt', c, v); }
  gte(c, v) { return this._f('gte', c, v); }
  lt(c, v) { return this._f('lt', c, v); }
  lte(c, v) { return this._f('lte', c, v); }
  in(c, v) { return this._f('in', c, v); }
  match(obj) {
    Object.entries(obj).forEach(([c, v]) => this.eq(c, v));
    return this;
  }
  order(col, { ascending = true } = {}) {
    this.q.order.push({ col, asc: ascending });
    return this;
  }
  limit(n) {
    this.q.limit = n;
    return this;
  }
  single() {
    this.q.single = true;
    return this;
  }
  maybeSingle() {
    this.q.maybeSingle = true;
    return this;
  }
  insert(values) {
    Object.assign(this.q, { action: 'insert', values });
    return this;
  }
  update(values) {
    Object.assign(this.q, { action: 'update', values });
    return this;
  }
  upsert(values, { onConflict, ignoreDuplicates } = {}) {
    Object.assign(this.q, { action: 'upsert', values, onConflict, ignoreDuplicates });
    return this;
  }
  delete() {
    this.q.action = 'delete';
    return this;
  }
  async exec() {
    const r = await request('/db', { body: this.q });
    return { data: r.data ?? null, error: r.error || null, count: r.count ?? null };
  }
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

/* ---------------- Client ---------------- */
export const db = {
  from: (table) => new Query(table),
  async rpc(name, args = {}) {
    const r = await request(`/rpc/${name}`, { body: args });
    return { data: r.data ?? null, error: r.error || null };
  },
  auth: {
    async getSession() {
      return { data: { session: readSession() } };
    },
    onAuthStateChange(cb) {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    async signInWithPassword({ email, password }) {
      const r = await request('/auth/login', { body: { email, password } });
      if (r.error) return { error: r.error };
      writeSession({ access_token: r.token, user: r.user }, 'SIGNED_IN');
      return { data: { user: r.user }, error: null };
    },
    async signOut() {
      writeSession(null, 'SIGNED_OUT');
      return { error: null };
    },
    async updateUser({ password }) {
      const r = await request('/auth/password', { body: { password } });
      return { error: r.error || null };
    },
    async resetPasswordForEmail() {
      return { error: { message: 'Pour réinitialiser votre mot de passe, contactez votre formateur ou l’équipe MCE : un nouveau mot de passe vous sera communiqué.' } };
    },
  },
};

/** Envoi d'un fichier ; renvoie son URL publique */
export async function uploadMedia(file, folder = 'uploads') {
  const form = new FormData();
  form.append('file', file);
  const r = await request(`/upload?folder=${encodeURIComponent(folder)}`, { form });
  if (r.error) throw new Error(r.error.message);
  return r.url;
}
