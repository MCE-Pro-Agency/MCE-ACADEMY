/* Contenus téléchargeables d'un module : leçons, mémos, missions et quiz (un PDF par élément).
   Si le module est fermé par le formateur, tout est verrouillé. */
import { useState } from 'react';
import { Download, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/db';
import { downloadLessonPdf, downloadMemoPdf, downloadQuizPdf } from '../lib/pdf';
import { MEMOS } from '../data/ressources';
import { moduleMeta } from '../data/programme';
import { cn } from '../lib/utils';

const GROUPS = [
  { key: 'text', label: 'Leçons', icon: '📖' },
  { key: 'memo', label: 'Mémos', icon: '🗂️' },
  { key: 'exercise', label: 'Exercices & missions', icon: '✍️' },
  { key: 'quiz', label: 'Quiz', icon: '🧠' },
];

export default function ModuleDownloads({ module, courseTitle, locked, lockReason, compact = false }) {
  const [busy, setBusy] = useState(null);
  const meta = moduleMeta(module);
  const memos = meta.theme && !meta.followUp ? MEMOS.filter((m) => m.module === meta.theme.id) : [];

  const items = {
    text: module.lessons.filter((l) => ['text', 'video', 'document'].includes(l.type)).map((l) => ({ id: l.id, title: l.title, lesson: l })),
    exercise: module.lessons.filter((l) => l.type === 'exercise').map((l) => ({ id: l.id, title: l.title, lesson: l })),
    quiz: module.lessons.filter((l) => l.type === 'quiz').map((l) => ({ id: l.id, title: l.title, lesson: l })),
    memo: memos.map((m) => ({ id: m.id, title: `${m.id} · ${m.titre}`, memo: m })),
  };

  const download = async (group, it) => {
    if (locked) return toast(lockReason || 'Ce module n’est pas encore ouvert.', { icon: '🔒' });
    setBusy(it.id);
    try {
      if (group === 'memo') return await downloadMemoPdf(it.memo, meta.theme?.nom || '');
      const { data: lesson, error } = await db.from('lessons').select('id, title, type, content').eq('id', it.id).single();
      if (error) throw error;
      if (group === 'quiz') {
        const { data: questions } = await db.from('quiz_questions').select('question, options, position').eq('lesson_id', it.id).order('position');
        await downloadQuizPdf({ lesson, questions: questions || [], moduleTitle: module.title, courseTitle });
      } else {
        await downloadLessonPdf({ lesson, moduleTitle: module.title, courseTitle, kind: group === 'exercise' ? 'Exercice' : 'Leçon' });
      }
    } catch (e) {
      toast.error(e?.message || 'Téléchargement impossible.');
    } finally {
      setBusy(null);
    }
  };

  const total = GROUPS.reduce((s, g) => s + items[g.key].length, 0);
  if (!total) return <p className="text-sm text-slate-400">Aucun contenu téléchargeable pour l’instant.</p>;

  return (
    <div className={cn('grid gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4')}>
      {GROUPS.filter((g) => items[g.key].length).map((g) => (
        <div key={g.key} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">{g.icon} {g.label} · {items[g.key].length}</p>
          <ul className="space-y-1.5">
            {items[g.key].map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => download(g.key, it)}
                  className={cn('flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 text-left text-xs font-medium ring-1 ring-slate-200 transition', locked ? 'cursor-not-allowed text-slate-400' : 'text-navy-800 hover:ring-brand-300')}
                  title={locked ? lockReason : 'Télécharger en PDF'}
                >
                  <span className="min-w-0 flex-1 truncate">{it.title}</span>
                  {locked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : busy === it.id ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500" /> : <Download className="h-3.5 w-3.5 shrink-0 text-brand-500" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
