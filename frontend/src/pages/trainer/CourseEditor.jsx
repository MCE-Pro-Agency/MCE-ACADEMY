import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, ChevronUp, ChevronDown, Pencil, Trash2, Save, Image as ImageIcon, Upload,
  LayoutList, Info, Users, CheckCircle2, GripVertical, X,
} from 'lucide-react';
import { db, uploadMedia } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, Badge, Field, Markdown, Modal, PageLoader, Spinner, Tabs, Toggle } from '../../components/ui';
import { CourseCover } from '../../components/CourseCard';
import { cn, LESSON_TYPES, LEVEL_LABELS } from '../../lib/utils';
import { moduleStore, MODULE_MODES, useLocalStoreVersion } from '../../lib/stores';
import ModuleJourney from '../../components/ModuleJourney';

/* Réglage du déblocage d'un module (table module_settings) */
function ModuleUnlock({ module, index }) {
  const s = moduleStore.get(module.id);
  const set = (patch) => { moduleStore.set(module.id, patch); toast.success('Déblocage mis à jour'); };
  const modes = Object.entries(MODULE_MODES).filter(([k]) => k !== 'sequential' || index > 0);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-3 text-sm">
      <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">🔓 Déblocage</span>
      {modes.map(([k, m]) => (
        <button key={k} onClick={() => set({ mode: k })} title={m.hint}
          className={cn('rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', s.mode === k ? 'bg-navy-800 text-white ring-navy-800' : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand-300')}>
          {m.label}
        </button>
      ))}
      {s.mode === 'date' && (
        <input type="date" defaultValue={s.opensAt} onChange={(e) => set({ opensAt: e.target.value })} className="input w-auto py-1 text-xs" />
      )}
      <span className="ml-auto"><Toggle checked={s.requiresProfile} onChange={(v) => set({ requiresProfile: v })} label={<span className="text-xs">Test de profil exigé</span>} /></span>
    </div>
  );
}

export default function CourseEditor() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [tab, setTab] = useState('content');
  const [lessonModal, setLessonModal] = useState(null); // { moduleId, lesson? }

  const load = async () => {
    const [{ data: c }, { data: mods }] = await Promise.all([
      db.from('courses').select('*').eq('id', courseId).single(),
      db.from('modules').select('*, lessons(*)').eq('course_id', courseId).order('position'),
    ]);
    setCourse(c);
    setModules((mods || []).map((m) => ({ ...m, lessons: (m.lessons || []).sort((a, b) => a.position - b.position) })));
  };

  useEffect(() => {
    load();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!course) return <PageLoader />;

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      <Link to="/formateur/cours" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Cours & modules
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title truncate">{course.title}</h1>
            {course.is_published ? <Badge tone="green" icon={CheckCircle2}>Publié</Badge> : <Badge tone="amber">Brouillon</Badge>}
          </div>
          <p className="page-subtitle">{modules.length} modules · {totalLessons} leçons</p>
        </div>
        <div className="flex gap-2">
          <button
            className={course.is_published ? 'btn-secondary' : 'btn-brand'}
            onClick={async () => {
              await db.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
              toast.success(course.is_published ? 'Repassé en brouillon' : 'Cours publié !');
              load();
            }}
          >
            {course.is_published ? 'Dépublier' : 'Publier le cours'}
          </button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'content', label: 'Contenu', icon: LayoutList },
          { value: 'info', label: 'Informations', icon: Info },
          { value: 'enroll', label: 'Inscriptions', icon: Users },
        ]}
      />

      {tab === 'content' && <ContentTab course={course} modules={modules} reload={load} onEditLesson={setLessonModal} />}
      {tab === 'info' && <InfoTab course={course} reload={load} />}
      {tab === 'enroll' && <EnrollTab course={course} />}

      {lessonModal && (
        <LessonModal
          moduleId={lessonModal.moduleId}
          lesson={lessonModal.lesson}
          courseId={course.id}
          position={modules.find((m) => m.id === lessonModal.moduleId)?.lessons.length || 0}
          onClose={() => setLessonModal(null)}
          onSaved={() => {
            setLessonModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ================= CONTENU ================= */
function ContentTab({ course, modules, reload, onEditLesson }) {
  useLocalStoreVersion({ refresh: true });
  const addModule = async () => {
    const { error } = await db.from('modules').insert({ course_id: course.id, title: `Module ${modules.length + 1}`, position: modules.length });
    if (error) return toast.error(error.message);
    reload();
  };

  const updateModule = async (id, patch) => {
    const { error } = await db.from('modules').update(patch).eq('id', id);
    if (error) toast.error(error.message);
  };

  const deleteModule = async (m) => {
    if (!confirm(`Supprimer le module « ${m.title} » et ses ${m.lessons.length} leçon(s) ?`)) return;
    await db.from('modules').delete().eq('id', m.id);
    reload();
  };

  const swap = async (table, a, b) => {
    await Promise.all([
      db.from(table).update({ position: b.position }).eq('id', a.id),
      db.from(table).update({ position: a.position }).eq('id', b.id),
    ]);
    reload();
  };

  // normalise les positions (0..n) pour que les échanges fonctionnent toujours
  const moveModule = (i, dir) => {
    const list = modules.map((m, idx) => ({ ...m, position: idx }));
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    swap('modules', list[i], list[j]);
  };
  const moveLesson = (m, i, dir) => {
    const list = m.lessons.map((l, idx) => ({ ...l, position: idx }));
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    swap('lessons', list[i], list[j]);
  };

  const deleteLesson = async (l) => {
    if (!confirm(`Supprimer la leçon « ${l.title} » ?`)) return;
    await db.from('lessons').delete().eq('id', l.id);
    reload();
  };

  const journey = modules.map((m, i) => {
    const st = moduleStore.get(m.id);
    const reason = st.requiresProfile ? 'Après le test de profil' : st.mode === 'closed' ? 'Fermé' : st.mode === 'date' ? (st.opensAt ? `Le ${new Date(st.opensAt).toLocaleDateString('fr-FR')}` : 'Date à définir') : st.mode === 'sequential' ? 'Après le module précédent' : null;
    return { title: m.title, pct: 0, reason, state: st.mode === 'open' && !st.requiresProfile ? 'open' : 'locked' };
  });

  return (
    <div className="space-y-4">
      {modules.length > 0 && (
        <div className="card p-5">
          <p className="eyebrow">Aperçu du parcours apprenant</p>
          <p className="mb-2 text-sm text-slate-500">Choisissez pour chaque module quand il s’ouvre : tout de suite, à une date (lundi → vendredi), quand le précédent est terminé, ou manuellement.</p>
          <ModuleJourney items={journey} />
        </div>
      )}
      {modules.map((m, mi) => (
        <div key={m.id} className="card overflow-hidden">
          <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
            <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-sm font-bold text-white">{mi + 1}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <input
                defaultValue={m.title}
                onBlur={(e) => e.target.value !== m.title && updateModule(m.id, { title: e.target.value })}
                className="w-full rounded-lg border-0 bg-transparent px-2 py-1 text-base font-bold text-navy-900 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-400"
              />
              <input
                defaultValue={m.description || ''}
                placeholder="Description du module (optionnel)"
                onBlur={(e) => e.target.value !== (m.description || '') && updateModule(m.id, { description: e.target.value })}
                className="w-full rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-slate-500 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex shrink-0 items-center">
              <button onClick={() => moveModule(mi, -1)} disabled={mi === 0} className="btn-ghost btn-sm" title="Monter"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => moveModule(mi, 1)} disabled={mi === modules.length - 1} className="btn-ghost btn-sm" title="Descendre"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => deleteModule(m)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>

          <ModuleUnlock module={m} index={mi} />
          <ul className="divide-y divide-slate-100">
            {m.lessons.map((l, li) => {
              const T = LESSON_TYPES[l.type];
              return (
                <li key={l.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                  <GripVertical className="h-4 w-4 text-slate-300" />
                  <span className={cn('rounded-lg p-1.5', T.color)}><T.icon className="h-4 w-4" /></span>
                  <button onClick={() => onEditLesson({ moduleId: m.id, lesson: l })} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-navy-800 hover:text-brand-600">{l.title}</p>
                    <p className="text-xs text-slate-400">{T.label} · {l.duration_minutes} min{l.type === 'video' && !l.video_url ? ' · ⚠ vidéo manquante' : ''}</p>
                  </button>
                  <div className="flex items-center opacity-60 transition group-hover:opacity-100">
                    <button onClick={() => moveLesson(m, li, -1)} disabled={li === 0} className="btn-ghost btn-sm"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveLesson(m, li, 1)} disabled={li === m.lessons.length - 1} className="btn-ghost btn-sm"><ChevronDown className="h-4 w-4" /></button>
                    <button onClick={() => onEditLesson({ moduleId: m.id, lesson: l })} className="btn-ghost btn-sm"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteLesson(l)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="p-3">
            <button onClick={() => onEditLesson({ moduleId: m.id })} className="btn-ghost w-full border-2 border-dashed border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600">
              <Plus className="h-4 w-4" /> Ajouter une leçon
            </button>
          </div>
        </div>
      ))}

      <button onClick={addModule} className="btn-secondary w-full py-3"><Plus className="h-4 w-4" /> Ajouter un module</button>
    </div>
  );
}

/* ================= LEÇON ================= */
function LessonModal({ moduleId, lesson, courseId, position, onClose, onSaved }) {
  const isNew = !lesson;
  const [form, setForm] = useState({
    title: lesson?.title || '',
    type: lesson?.type || 'text',
    duration_minutes: lesson?.duration_minutes ?? 5,
    passing_score: lesson?.passing_score ?? 70,
    content: lesson?.content || '',
    video_url: lesson?.video_url || '',
    file_url: lesson?.file_url || '',
  });
  const [questions, setQuestions] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!lesson || lesson.type !== 'quiz') return;
    (async () => {
      const { data: qs } = await db.from('quiz_questions').select('*').eq('lesson_id', lesson.id).order('position');
      const ids = (qs || []).map((q) => q.id);
      const { data: ans } = ids.length ? await db.from('quiz_answers').select('*').in('question_id', ids) : { data: [] };
      const amap = Object.fromEntries((ans || []).map((a) => [a.question_id, a]));
      setQuestions((qs || []).map((q) => ({ id: q.id, question: q.question, options: q.options, correct: amap[q.id]?.correct_index ?? 0, explanation: amap[q.id]?.explanation || '' })));
    })();
  }, [lesson]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      set(key, await uploadMedia(file, `courses/${courseId}`));
      toast.success('Fichier envoyé');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => setQuestions((q) => [...q, { question: '', options: ['', ''], correct: 0, explanation: '' }]);
  const updateQ = (i, patch) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i) => {
    const q = questions[i];
    if (q.id) setRemovedIds((r) => [...r, q.id]);
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Le titre est requis.');
    if (form.type === 'quiz') {
      for (const [i, q] of questions.entries()) {
        if (!q.question.trim()) return toast.error(`Question ${i + 1} : texte manquant.`);
        if (q.options.filter((o) => o.trim()).length < 2) return toast.error(`Question ${i + 1} : au moins 2 réponses.`);
      }
    }
    setSaving(true);
    try {
      const payload = { ...form, duration_minutes: Number(form.duration_minutes) || 0, passing_score: Number(form.passing_score) || 70, module_id: moduleId, course_id: courseId };
      let lessonId = lesson?.id;
      if (isNew) {
        const { data, error } = await db.from('lessons').insert({ ...payload, position }).select().single();
        if (error) throw error;
        lessonId = data.id;
      } else {
        const { error } = await db.from('lessons').update(payload).eq('id', lessonId);
        if (error) throw error;
      }

      if (form.type === 'quiz') {
        if (removedIds.length) await db.from('quiz_questions').delete().in('id', removedIds);
        for (const [i, q] of questions.entries()) {
          const options = q.options.filter((o) => o.trim());
          const correct = Math.min(q.correct, options.length - 1);
          let qid = q.id;
          if (qid) {
            const { error } = await db.from('quiz_questions').update({ question: q.question, options, position: i }).eq('id', qid);
            if (error) throw error;
          } else {
            const { data, error } = await db.from('quiz_questions').insert({ lesson_id: lessonId, question: q.question, options, position: i }).select().single();
            if (error) throw error;
            qid = data.id;
          }
          const { error: aErr } = await db.from('quiz_answers').upsert({ question_id: qid, correct_index: correct, explanation: q.explanation || null });
          if (aErr) throw aErr;
        }
      }
      toast.success(isNew ? 'Leçon ajoutée' : 'Leçon enregistrée');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={isNew ? 'Nouvelle leçon' : 'Modifier la leçon'}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={save} disabled={saving || uploading} className="btn-primary">{saving ? <Spinner className="text-white" /> : <><Save className="h-4 w-4" /> Enregistrer</>}</button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="label">Type de leçon</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(LESSON_TYPES).map(([k, T]) => (
              <button
                key={k}
                type="button"
                onClick={() => set('type', k)}
                className={cn('flex flex-col items-center gap-1.5 rounded-xl p-3 text-sm font-semibold ring-1 ring-inset transition', form.type === k ? 'bg-brand-50 text-brand-700 ring-brand-400' : 'text-slate-600 ring-slate-200 hover:bg-slate-50')}
              >
                <T.icon className="h-5 w-5" /> {T.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Titre *" className="sm:col-span-3"><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Durée (min)"><input type="number" min={0} className="input" value={form.duration_minutes} onChange={(e) => set('duration_minutes', e.target.value)} /></Field>
        </div>

        {form.type === 'video' && (
          <Field label="Vidéo" hint="Lien YouTube, Vimeo ou fichier MP4 — ou envoyez un fichier.">
            <div className="flex gap-2">
              <input className="input" placeholder="https://www.youtube.com/watch?v=…" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} />
              <label className="btn-secondary shrink-0 cursor-pointer">{uploading ? <Spinner /> : <Upload className="h-4 w-4" />}<input type="file" accept="video/*" className="hidden" onChange={(e) => upload(e, 'video_url')} /></label>
            </div>
          </Field>
        )}

        {form.type === 'document' && (
          <Field label="Document (PDF, PPT, Word…)">
            <div className="flex gap-2">
              <input className="input" placeholder="URL du document" value={form.file_url} onChange={(e) => set('file_url', e.target.value)} />
              <label className="btn-secondary shrink-0 cursor-pointer">{uploading ? <Spinner /> : <Upload className="h-4 w-4" />} Envoyer<input type="file" className="hidden" onChange={(e) => upload(e, 'file_url')} /></label>
            </div>
          </Field>
        )}

        {form.type === 'quiz' && (
          <Field label="Score minimum pour réussir (%)" className="sm:w-64">
            <input type="number" min={0} max={100} className="input" value={form.passing_score} onChange={(e) => set('passing_score', e.target.value)} />
          </Field>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">
              {form.type === 'exercise' ? 'Consigne de l’exercice' : form.type === 'quiz' ? 'Introduction (optionnel)' : 'Contenu'}{' '}
              <span className="font-normal text-slate-400">(Markdown : # titre, **gras**, - liste, | tableau |)</span>
            </span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="btn-ghost btn-sm">{preview ? 'Éditer' : 'Aperçu'}</button>
          </div>
          {preview ? (
            <div className="min-h-[220px] rounded-xl bg-slate-50 p-5"><Markdown>{form.content}</Markdown></div>
          ) : (
            <textarea className="input min-h-[220px] font-mono text-[13px]" value={form.content} onChange={(e) => set('content', e.target.value)} />
          )}
        </div>

        {form.type === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-navy-900">Questions ({questions.length})</h4>
              <button type="button" onClick={addQuestion} className="btn-secondary btn-sm"><Plus className="h-3.5 w-3.5" /> Question</button>
            </div>
            {questions.map((q, i) => (
              <div key={q.id || i} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex gap-2">
                  <span className="mt-2.5 text-sm font-bold text-brand-500">{i + 1}.</span>
                  <input className="input" placeholder="Intitulé de la question" value={q.question} onChange={(e) => updateQ(i, { question: e.target.value })} />
                  <button type="button" onClick={() => removeQ(i)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 space-y-2 pl-6">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correct === oi} onChange={() => updateQ(i, { correct: oi })} className="h-4 w-4 text-emerald-500 focus:ring-emerald-400" title="Bonne réponse" />
                      <input
                        className={cn('input py-2', q.correct === oi && 'ring-emerald-300 bg-emerald-50/50')}
                        placeholder={`Réponse ${String.fromCharCode(65 + oi)}`}
                        value={opt}
                        onChange={(e) => updateQ(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                      />
                      {q.options.length > 2 && (
                        <button type="button" onClick={() => updateQ(i, { options: q.options.filter((_, k) => k !== oi), correct: q.correct >= oi && q.correct > 0 ? q.correct - 1 : q.correct })} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => updateQ(i, { options: [...q.options, ''] })} className="text-xs font-semibold text-brand-600">+ Ajouter une réponse</button>
                  )}
                  <input className="input mt-2 py-2 text-sm" placeholder="Explication affichée après la réponse (optionnel)" value={q.explanation} onChange={(e) => updateQ(i, { explanation: e.target.value })} />
                  <p className="text-xs text-slate-400">● Cochez le bouton rond de la bonne réponse.</p>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Ajoutez votre première question.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ================= INFORMATIONS ================= */
function InfoTab({ course, reload }) {
  const [form, setForm] = useState({
    title: course.title,
    subtitle: course.subtitle || '',
    category: course.category || '',
    level: course.level,
    estimated_minutes: course.estimated_minutes || 0,
    description: course.description || '',
    cover_url: course.cover_url || '',
    is_published: course.is_published,
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set('cover_url', await uploadMedia(file, `covers/${course.id}`));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await db.from('courses').update({ ...form, estimated_minutes: Number(form.estimated_minutes) || 0 }).eq('id', course.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Informations enregistrées');
    reload();
  };

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
      <div className="card space-y-4 p-6 lg:col-span-2">
        <Field label="Titre"><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Sous-titre"><input className="input" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Catégorie"><input className="input" value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
          <Field label="Niveau">
            <select className="input" value={form.level} onChange={(e) => set('level', e.target.value)}>
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Durée estimée (min)"><input type="number" className="input" value={form.estimated_minutes} onChange={(e) => set('estimated_minutes', e.target.value)} /></Field>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">Description (Markdown)</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="btn-ghost btn-sm">{preview ? 'Éditer' : 'Aperçu'}</button>
          </div>
          {preview ? <div className="min-h-[200px] rounded-xl bg-slate-50 p-5"><Markdown>{form.description}</Markdown></div> : <textarea className="input min-h-[200px] font-mono text-[13px]" value={form.description} onChange={(e) => set('description', e.target.value)} />}
        </div>
      </div>
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <CourseCover course={{ ...course, cover_url: form.cover_url }} className="aspect-video" />
          <div className="flex gap-2 p-4">
            <label className="btn-secondary flex-1 cursor-pointer"><ImageIcon className="h-4 w-4" /> Image de couverture<input type="file" accept="image/*" className="hidden" onChange={uploadCover} /></label>
            {form.cover_url && <button type="button" onClick={() => set('cover_url', '')} className="btn-ghost"><Trash2 className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="card p-5">
          <Toggle checked={form.is_published} onChange={(v) => set('is_published', v)} label={form.is_published ? 'Publié — visible des apprenants' : 'Brouillon — invisible des apprenants'} />
        </div>
        <button className="btn-primary w-full" disabled={saving}>{saving ? <Spinner className="text-white" /> : <><Save className="h-4 w-4" /> Enregistrer</>}</button>
      </div>
    </form>
  );
}

/* ================= INSCRIPTIONS ================= */
function EnrollTab({ course }) {
  const { activeCompanyId } = useAuth();
  const [learners, setLearners] = useState(null);
  const [enrolled, setEnrolled] = useState(new Set());

  const load = async () => {
    const [{ data: l }, { data: e }] = await Promise.all([
      db.from('profiles').select('id, full_name, email, job_title, is_active').eq('company_id', activeCompanyId).eq('role', 'learner').order('full_name'),
      db.from('enrollments').select('user_id').eq('course_id', course.id),
    ]);
    setLearners(l || []);
    setEnrolled(new Set((e || []).map((x) => x.user_id)));
  };
  useEffect(() => {
    load();
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (uid) => {
    if (enrolled.has(uid)) {
      await db.from('enrollments').delete().eq('course_id', course.id).eq('user_id', uid);
    } else {
      await db.from('enrollments').insert({ course_id: course.id, user_id: uid });
    }
    load();
  };

  const enrollAll = async () => {
    const rows = learners.filter((l) => !enrolled.has(l.id)).map((l) => ({ course_id: course.id, user_id: l.id }));
    if (!rows.length) return;
    const { error } = await db.from('enrollments').insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} apprenant(s) inscrit(s)`);
    load();
  };

  if (!learners) return <PageLoader />;

  return (
    <div className="card">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-600"><strong className="text-navy-900">{enrolled.size}</strong> / {learners.length} apprenants inscrits</p>
        <button onClick={enrollAll} className="btn-primary btn-sm"><Users className="h-4 w-4" /> Inscrire tous les apprenants</button>
      </div>
      <ul className="divide-y divide-slate-100">
        {learners.map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar name={l.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900">{l.full_name}</p>
              <p className="truncate text-xs text-slate-500">{l.email}</p>
            </div>
            <Toggle checked={enrolled.has(l.id)} onChange={() => toggle(l.id)} label={enrolled.has(l.id) ? 'Inscrit' : 'Non inscrit'} />
          </li>
        ))}
        {learners.length === 0 && <li className="p-5 text-sm text-slate-500">Aucun apprenant dans cet espace.</li>}
      </ul>
    </div>
  );
}
