import { FileText, PlayCircle, HelpCircle, PenLine, Paperclip } from 'lucide-react';

export const cn = (...c) => c.filter(Boolean).join(' ');

export function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m > 0) return `${m} min`;
  return s > 0 ? `${s} s` : '0 min';
}

export function formatMinutes(min = 0) {
  return formatDuration((Number(min) || 0) * 60);
}

export function formatDate(d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', opts);
}

export function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(d) {
  if (!d) return 'Jamais';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `Il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(d);
}

export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}

export const num = (v, digits = 0) => (v === null || v === undefined || v === '' ? null : Number(Number(v).toFixed(digits)));

export const ROLE_LABELS = { admin: 'Administrateur', trainer: 'Formateur', learner: 'Apprenant' };
export const LEVEL_LABELS = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

export const LESSON_TYPES = {
  text: { label: 'Leçon', icon: FileText, color: 'text-brand-600 bg-brand-50' },
  video: { label: 'Vidéo', icon: PlayCircle, color: 'text-indigo-600 bg-indigo-50' },
  quiz: { label: 'Quiz', icon: HelpCircle, color: 'text-amber-700 bg-amber-50' },
  exercise: { label: 'Exercice', icon: PenLine, color: 'text-emerald-700 bg-emerald-50' },
  document: { label: 'Document', icon: Paperclip, color: 'text-slate-700 bg-slate-100' },
};

/** Convertit une URL YouTube / Vimeo en URL d'intégration */
export function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { type: 'video', src: url };
}

/** Parse un CSV simple (séparateur , ou ;) avec en-tête */
export function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
  });
}

/** Normalise les en-têtes CSV courants vers email / full_name / job_title */
export function normalizeImportRow(row) {
  const pick = (...keys) => keys.map((k) => row[k]).find((v) => v);
  const first = pick('prenom', 'prénom', 'firstname', 'first_name');
  const last = pick('nom', 'lastname', 'last_name');
  return {
    email: pick('email', 'e-mail', 'mail', 'courriel'),
    full_name: pick('full_name', 'nom complet', 'name', 'nom_complet') || [first, last].filter(Boolean).join(' '),
    job_title: pick('job_title', 'poste', 'fonction', 'job'),
  };
}

export function scoreColor(score) {
  if (score === null || score === undefined || score === '') return 'text-slate-400';
  const s = Number(score);
  if (Number.isNaN(s)) return 'text-slate-400';
  if (s >= 80) return 'text-emerald-600';
  if (s >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => esc(r[h])).join(';'))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
