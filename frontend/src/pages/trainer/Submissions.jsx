import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Paperclip, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar, Badge, EmptyState, Field, Markdown, Modal, PageLoader, Tabs } from '../../components/ui';
import { formatDateTime } from '../../lib/utils';

const STATUS = {
  submitted: { label: 'À corriger', tone: 'brand' },
  graded: { label: 'Corrigé', tone: 'gold' },
  returned: { label: 'À reprendre', tone: 'amber' },
};

export default function Submissions() {
  const { activeCompanyId, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('submitted');
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ grade: '', feedback: '' });

  const load = async () => {
    const { data, error } = await supabase
      .from('exercise_submissions')
      .select('*, learner:profiles!exercise_submissions_user_id_fkey(full_name, email), lesson:lessons(title, content), course:courses!inner(title, company_id)')
      .eq('course.company_id', activeCompanyId)
      .order('submitted_at', { ascending: false });
    if (error) toast.error(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (activeCompanyId) load();
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (s) => {
    setCurrent(s);
    setForm({ grade: s.grade ?? '', feedback: s.feedback || '' });
  };

  const save = async (status) => {
    const grade = form.grade === '' ? null : Number(form.grade);
    if (status === 'graded' && (grade === null || grade < 0 || grade > 20)) return toast.error('Saisissez une note entre 0 et 20.');
    const { error } = await supabase
      .from('exercise_submissions')
      .update({ grade: status === 'graded' ? grade : null, feedback: form.feedback, status, graded_by: profile.id, graded_at: new Date().toISOString() })
      .eq('id', current.id);
    if (error) return toast.error(error.message);
    toast.success(status === 'graded' ? 'Note enregistrée' : 'Exercice renvoyé à l’apprenant');
    setCurrent(null);
    load();
  };

  if (loading) return <PageLoader />;
  const filtered = items.filter((i) => i.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Corrections</h1>
        <p className="page-subtitle">Notez les exercices de vos apprenants sur 20 et laissez-leur un retour.</p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label, count: items.filter((i) => i.status === value).length }))}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Rien à afficher" description={tab === 'submitted' ? 'Tous les exercices sont corrigés 👏' : 'Aucun exercice dans cette catégorie.'} />
      ) : (
        <div className="card divide-y divide-slate-100">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => open(s)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50">
              <Avatar name={s.learner?.full_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy-900">{s.learner?.full_name} <span className="font-normal text-slate-400">· {s.lesson?.title}</span></p>
                <p className="truncate text-xs text-slate-500">{s.course?.title} · rendu le {formatDateTime(s.submitted_at)}</p>
              </div>
              {s.grade !== null && <span className="font-bold text-navy-900">{Number(s.grade)}/20</span>}
              <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!current}
        onClose={() => setCurrent(null)}
        size="lg"
        title={current ? `${current.learner?.full_name} — ${current.lesson?.title}` : ''}
        description={current?.course?.title}
        footer={
          <>
            <button onClick={() => save('returned')} className="btn-secondary">Renvoyer pour correction</button>
            <button onClick={() => save('graded')} className="btn-primary"><Send className="h-4 w-4" /> Enregistrer la note</button>
          </>
        }
      >
        {current && (
          <div className="space-y-5">
            <details className="rounded-xl bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-navy-700">Voir la consigne</summary>
              <Markdown className="prose-sm mt-3">{current.lesson?.content}</Markdown>
            </details>
            <div>
              <p className="label">Réponse de l’apprenant</p>
              <div className="whitespace-pre-line rounded-xl bg-brand-50/50 p-4 text-sm text-navy-800 ring-1 ring-brand-100">{current.content || <em className="text-slate-400">Aucun texte</em>}</div>
              {current.file_url && (
                <a href={current.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><Paperclip className="h-4 w-4" /> Fichier joint</a>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Note /20">
                <input type="number" step="0.5" min={0} max={20} className="input text-lg font-bold" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              </Field>
              <Field label="Retour à l’apprenant" className="sm:col-span-3">
                <textarea className="input min-h-[110px]" placeholder="Points forts, axes d’amélioration, conseil applicable…" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
