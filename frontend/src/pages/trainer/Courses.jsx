import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, GraduationCap, Users, CheckCircle2, Pencil, Eye, Trash2, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { Badge, EmptyState, Field, Modal, PageLoader, ProgressBar, Toggle } from '../../components/ui';
import { CourseCover } from '../../components/CourseCard';
import { LEVEL_LABELS } from '../../lib/utils';

export default function TrainerCourses() {
  const { activeCompanyId, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', category: '', level: 'debutant' });

  const load = async () => {
    const [{ data }, s] = await Promise.all([
      db.from('courses').select('*').eq('company_id', activeCompanyId).order('created_at', { ascending: false }),
      db.rpc('company_course_stats', { p_company: activeCompanyId }),
    ]);
    setCourses(data || []);
    setStats(Object.fromEntries((s.data || []).map((r) => [r.course_id, r])));
    setLoading(false);
  };

  useEffect(() => {
    if (activeCompanyId) load();
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (e) => {
    e.preventDefault();
    const { data, error } = await db
      .from('courses')
      .insert({ ...form, company_id: activeCompanyId, created_by: profile.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await db.from('modules').insert({ course_id: data.id, title: 'Module 1', position: 0 });
    toast.success('Cours créé');
    navigate(`/formateur/cours/${data.id}`);
  };

  const togglePublish = async (c) => {
    const { error } = await db.from('courses').update({ is_published: !c.is_published }).eq('id', c.id);
    if (error) return toast.error(error.message);
    toast.success(c.is_published ? 'Cours repassé en brouillon' : 'Cours publié : visible par les apprenants');
    load();
  };

  const remove = async (c) => {
    if (!confirm(`Supprimer « ${c.title} » ? Modules, leçons, notes et progressions associés seront supprimés.`)) return;
    const { error } = await db.from('courses').delete().eq('id', c.id);
    if (error) return toast.error(error.message);
    toast.success('Cours supprimé');
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Cours & modules</h1>
          <p className="page-subtitle">Créez vos parcours : modules, leçons, vidéos, quiz et exercices.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nouveau cours</button>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Aucun cours" description="Créez votre premier cours pour cet espace entreprise." action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Créer un cours</button>} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const s = stats[c.id] || {};
            return (
              <div key={c.id} className="card flex flex-col overflow-hidden">
                <CourseCover course={c} className="aspect-[16/8]">
                  <div className="absolute left-3 top-3">
                    {c.is_published ? <Badge tone="green" icon={CheckCircle2}>Publié</Badge> : <Badge tone="amber">Brouillon</Badge>}
                  </div>
                </CourseCover>
                <div className="flex flex-1 flex-col p-5">
                  <Link to={`/formateur/cours/${c.id}`} className="font-bold text-navy-900 hover:text-brand-600">{c.title}</Link>
                  <p className="mt-1 text-xs text-slate-500">{c.category || 'Sans catégorie'} · {LEVEL_LABELS[c.level]}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 py-2"><p className="text-lg font-bold text-navy-900">{s.total_lessons ?? 0}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><BookOpen className="h-3 w-3" /> leçons</p></div>
                    <div className="rounded-xl bg-slate-50 py-2"><p className="text-lg font-bold text-navy-900">{s.enrolled ?? 0}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><Users className="h-3 w-3" /> inscrits</p></div>
                    <div className="rounded-xl bg-slate-50 py-2"><p className="text-lg font-bold text-navy-900">{s.completed ?? 0}</p><p className="text-[11px] text-slate-500">terminés</p></div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-1 text-xs text-slate-500">Progression moyenne</p>
                    <ProgressBar value={s.avg_progress || 0} size="sm" showLabel />
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                    <Toggle checked={c.is_published} onChange={() => togglePublish(c)} label={c.is_published ? 'Publié' : 'Publier'} />
                    <div className="flex gap-1">
                      <Link to={`/app/cours/${c.id}`} className="btn-ghost btn-sm" title="Aperçu"><Eye className="h-4 w-4" /></Link>
                      <button onClick={() => remove(c)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                      <Link to={`/formateur/cours/${c.id}`} className="btn-primary btn-sm"><Pencil className="h-3.5 w-3.5" /> Éditer</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau cours">
        <form onSubmit={create} className="space-y-4">
          <Field label="Titre *"><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Prise de parole en public" /></Field>
          <Field label="Sous-titre"><input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catégorie"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Management, Soft skills…" /></Field>
            <Field label="Niveau">
              <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Annuler</button>
            <button className="btn-primary">Créer et éditer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
