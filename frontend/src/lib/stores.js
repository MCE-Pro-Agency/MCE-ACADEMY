/* =====================================================================
   Profils professionnels & déblocage des modules — stockés dans MySQL
   (tables profile_assessments et module_settings).
   Un cache en mémoire permet aux écrans de lire de façon synchrone ;
   chaque écriture met à jour le cache puis la base via l'API.
   ===================================================================== */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { db } from './db';

const EVT = 'mce-store';
const cache = { profils: {}, modules: {} };
const emit = () => window.dispatchEvent(new Event(EVT));

/** Charge (ou recharge) les données visibles par l'utilisateur connecté */
export async function syncStores() {
  const [p, m] = await Promise.all([db.from('profile_assessments').select('*'), db.from('module_settings').select('*')]);
  cache.profils = Object.fromEntries((p.data || []).map((r) => [r.user_id, r]));
  cache.modules = Object.fromEntries((m.data || []).map((r) => [r.module_id, r]));
  emit();
}
export function clearStores() {
  cache.profils = {};
  cache.modules = {};
  emit();
}

/** Re-rend le composant quand les données changent ; recharge depuis la base au montage */
export function useLocalStoreVersion({ refresh = false } = {}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((x) => x + 1);
    window.addEventListener(EVT, bump);
    if (refresh) syncStores().catch(() => {});
    return () => window.removeEventListener(EVT, bump);
  }, [refresh]);
  return v;
}

const fail = (e) => toast.error(e?.message || 'Enregistrement impossible.');

/* ---------------- PROFILS PROFESSIONNELS ---------------- */
const emptyProfil = () => ({ runs: [], draft: null, retake: false, comment: '' });
const toProfil = (row) => (row ? { runs: row.runs || [], draft: row.draft || null, retake: !!row.retake, comment: row.comment || '' } : emptyProfil());

export const profilStore = {
  get(userId) {
    return toProfil(cache.profils[userId]);
  },
  all() {
    return Object.fromEntries(Object.entries(cache.profils).map(([k, v]) => [k, toProfil(v)]));
  },
  async patch(userId, patch) {
    const next = { ...this.get(userId), ...patch };
    cache.profils[userId] = { user_id: userId, ...next };
    emit();
    const { error } = await db
      .from('profile_assessments')
      .upsert({ user_id: userId, runs: next.runs, draft: next.draft, retake: next.retake, comment: next.comment || null }, { onConflict: 'user_id' });
    if (error) fail(error);
  },
  saveDraft(userId, draft) {
    return this.patch(userId, { draft });
  },
  addRun(userId, run) {
    return this.patch(userId, { runs: [...this.get(userId).runs, run], draft: null, retake: false });
  },
  setComment(userId, comment) {
    return this.patch(userId, { comment });
  },
  allowRetake(userId) {
    return this.patch(userId, { retake: true });
  },
  async reset(userId) {
    delete cache.profils[userId];
    emit();
    const { error } = await db.from('profile_assessments').delete().eq('user_id', userId);
    if (error) fail(error);
  },
};

export const profilDone = (p) => Boolean(p?.runs?.length);
export const lastRun = (p) => (profilDone(p) ? p.runs[p.runs.length - 1] : null);
export const firstRun = (p) => (profilDone(p) ? p.runs[0] : null);

/* ---------------- DÉBLOCAGE DES MODULES ----------------
   mode : 'open' | 'closed' | 'date' (opensAt) | 'sequential' ; requiresProfile : test de profil exigé */
export const MODULE_MODES = {
  open: { label: 'Ouvert', hint: 'Accessible immédiatement' },
  closed: { label: 'Fermé', hint: 'Ouvert manuellement par le formateur' },
  date: { label: 'À une date', hint: 'S’ouvre automatiquement le jour choisi' },
  sequential: { label: 'Progressif', hint: 'S’ouvre quand le module précédent est terminé' },
};

export const moduleStore = {
  get(moduleId) {
    const r = cache.modules[moduleId];
    return { mode: r?.mode || 'open', opensAt: r?.opens_at ? String(r.opens_at).slice(0, 10) : '', requiresProfile: !!r?.requires_profile };
  },
  async set(moduleId, patch) {
    const next = { ...this.get(moduleId), ...patch };
    cache.modules[moduleId] = { module_id: moduleId, mode: next.mode, opens_at: next.opensAt || null, requires_profile: next.requiresProfile };
    emit();
    const { error } = await db.from('module_settings').upsert(cache.modules[moduleId], { onConflict: 'module_id' });
    if (error) fail(error);
  },
};

const todayStr = () => new Date().toISOString().slice(0, 10);

/** État de verrouillage d'un module pour un apprenant */
export function moduleLockState(course, index, progress, hasProfil) {
  const m = course.modules[index];
  const s = moduleStore.get(m.id);
  const doneCount = m.lessons.filter((l) => progress[l.id]?.completed).length;
  const pct = m.lessons.length ? Math.round((doneCount / m.lessons.length) * 100) : 0;
  const done = m.lessons.length > 0 && doneCount === m.lessons.length;
  const base = { done, pct, kind: s.mode, opensAt: s.opensAt };

  if (s.requiresProfile && !hasProfil) return { ...base, locked: true, kind: 'profil', reason: 'Passez d’abord votre test de profil professionnel' };
  if (s.mode === 'closed') return { ...base, locked: true, reason: 'Sera ouvert par votre formateur' };
  if (s.mode === 'date' && s.opensAt && todayStr() < s.opensAt)
    return { ...base, locked: true, reason: `S’ouvre le ${new Date(s.opensAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` };
  if (s.mode === 'sequential' && index > 0) {
    const prev = course.modules[index - 1];
    const prevDone = prev.lessons.length > 0 && prev.lessons.every((l) => progress[l.id]?.completed);
    if (!prevDone) return { ...base, locked: true, reason: `Terminez d’abord « ${prev.title} »` };
  }
  return { ...base, locked: false, reason: null };
}
