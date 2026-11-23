import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Upload, Download, SlidersHorizontal, MoreVertical, KeyRound, UserX, UserCheck, Trash2, Eye, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Avatar, Badge, CredentialBox, EmptyState, Field, Modal, PageLoader, ProgressBar, Spinner } from '../../components/ui';
import { downloadCSV, formatDuration, normalizeImportRow, parseCSV, scoreColor, timeAgo, num } from '../../lib/utils';

export default function Learners() {
  const { activeCompanyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('name');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    const [l, c] = await Promise.all([
      db.rpc('company_learner_stats', { p_company: activeCompanyId }),
      db.from('courses').select('id, title, is_published').eq('company_id', activeCompanyId).order('created_at'),
    ]);
    setLearners(l.data || []);
    setCourses(c.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (activeCompanyId) load();
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const list = learners.filter((l) => {
      if (status === 'active' && !l.is_active) return false;
      if (status === 'inactive' && l.is_active) return false;
      return !s || `${l.full_name} ${l.email} ${l.job_title || ''}`.toLowerCase().includes(s);
    });
    const sorters = {
      name: (a, b) => a.full_name.localeCompare(b.full_name),
      progress: (a, b) => Number(b.progress_pct) - Number(a.progress_pct),
      time: (a, b) => Number(b.total_seconds) - Number(a.total_seconds),
      recent: (a, b) => new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0),
      score: (a, b) => Number(b.avg_quiz_score || 0) - Number(a.avg_quiz_score || 0),
    };
    return [...list].sort(sorters[sort]);
  }, [learners, search, status, sort]);

  const toggleActive = async (l) => {
    try {
      await api(`/users/${l.user_id}`, { method: 'PATCH', body: { is_active: !l.is_active } });
      toast.success(l.is_active ? 'Compte désactivé' : 'Compte réactivé');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const resetPassword = async (l) => {
    try {
      const res = await api(`/users/${l.user_id}/reset-password`, { method: 'POST' });
      setCredentials({ email: l.email, password: res.temporary_password });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (l) => {
    if (!confirm(`Supprimer définitivement ${l.full_name} et toutes ses données ?`)) return;
    try {
      await api(`/users/${l.user_id}`, { method: 'DELETE' });
      toast.success('Apprenant supprimé');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const exportCSV = () =>
    downloadCSV(
      'apprenants.csv',
      filtered.map((l) => ({
        Nom: l.full_name,
        Email: l.email,
        Poste: l.job_title || '',
        'Progression (%)': Number(l.progress_pct),
        'Leçons terminées': `${l.lessons_completed}/${l.total_lessons}`,
        'Temps de connexion': formatDuration(l.total_seconds),
        'Moyenne quiz (%)': num(l.avg_quiz_score) ?? '',
        'Moyenne exercices (/20)': num(l.avg_exercise_grade, 1) ?? '',
        'Dernière connexion': l.last_seen_at ? new Date(l.last_seen_at).toLocaleString('fr-FR') : 'Jamais',
        Statut: l.is_active ? 'Actif' : 'Désactivé',
      }))
    );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Apprenants</h1>
          <p className="page-subtitle">{learners.length} apprenant{learners.length > 1 ? 's' : ''} dans votre espace · notes, progression et temps de connexion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} className="btn-secondary"><Download className="h-4 w-4" /> Exporter</button>
          <button onClick={() => setImportOpen(true)} className="btn-secondary"><Upload className="h-4 w-4" /> Importer CSV</button>
          <button onClick={() => setAddOpen(true)} className="btn-primary"><UserPlus className="h-4 w-4" /> Ajouter</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-brand-600" />
          <input className="input pl-10" placeholder="Rechercher par nom, email, poste…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Désactivés</option>
        </select>
        <select className="input sm:w-52" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Trier : nom</option>
          <option value="progress">Trier : progression</option>
          <option value="score">Trier : moyenne quiz</option>
          <option value="time">Trier : temps de connexion</option>
          <option value="recent">Trier : dernière connexion</option>
        </select>
      </div>

      {learners.length === 0 ? (
        <EmptyState icon={Users} title="Aucun apprenant" description="Ajoutez vos apprenants un par un ou importez une liste CSV." action={<button onClick={() => setAddOpen(true)} className="btn-primary"><UserPlus className="h-4 w-4" /> Ajouter un apprenant</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="table-th">Apprenant</th>
                <th className="table-th w-56">Progression</th>
                <th className="table-th">Quiz</th>
                <th className="table-th">Exercices</th>
                <th className="table-th">Temps</th>
                <th className="table-th">Dernière connexion</th>
                <th className="table-th w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.user_id} className={`hover:bg-slate-50/60 ${!l.is_active ? 'opacity-60' : ''}`}>
                  <td className="table-td">
                    <Link to={`/formateur/apprenants/${l.user_id}?onglet=profil`} className="flex items-center gap-3">
                      <Avatar name={l.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900 hover:text-brand-600">{l.full_name}</p>
                        <p className="truncate text-xs text-slate-500">{l.email}{l.job_title ? ` · ${l.job_title}` : ''}</p>
                      </div>
                      {!l.is_active && <Badge tone="red">Désactivé</Badge>}
                    </Link>
                  </td>
                  <td className="table-td">
                    <ProgressBar value={l.progress_pct} size="sm" showLabel />
                    <p className="mt-0.5 text-xs text-slate-400">{l.lessons_completed}/{l.total_lessons} leçons · {l.completed_courses}/{l.enrolled_courses} cours</p>
                  </td>
                  <td className={`table-td font-semibold ${scoreColor(l.avg_quiz_score)}`}>{num(l.avg_quiz_score) !== null ? `${num(l.avg_quiz_score)}%` : '—'}</td>
                  <td className="table-td font-semibold">{num(l.avg_exercise_grade, 1) !== null ? `${num(l.avg_exercise_grade, 1)}/20` : '—'}</td>
                  <td className="table-td whitespace-nowrap">{formatDuration(l.total_seconds)}<p className="text-xs text-slate-400">{l.sessions_count} sessions</p></td>
                  <td className="table-td whitespace-nowrap text-slate-500">{timeAgo(l.last_seen_at)}</td>
                  <td className="table-td relative">
                    <button onClick={() => setMenu(menu === l.user_id ? null : l.user_id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-800">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menu === l.user_id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                        <div className="absolute right-4 top-10 z-20 w-56 rounded-xl bg-white py-1.5 shadow-lift ring-1 ring-slate-100" onClick={() => setMenu(null)}>
                          <Link to={`/formateur/apprenants/${l.user_id}`} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"><Eye className="h-4 w-4" /> Voir le suivi</Link>
                          <button onClick={() => resetPassword(l)} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"><KeyRound className="h-4 w-4" /> Nouveau mot de passe</button>
                          <button onClick={() => toggleActive(l)} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                            {l.is_active ? <><UserX className="h-4 w-4" /> Désactiver</> : <><UserCheck className="h-4 w-4" /> Réactiver</>}
                          </button>
                          <button onClick={() => remove(l)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLearnerModal open={addOpen} onClose={() => setAddOpen(false)} courses={courses} companyId={activeCompanyId} onDone={load} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} courses={courses} companyId={activeCompanyId} onDone={load} />
      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Nouveau mot de passe" size="sm">
        {credentials && <CredentialBox email={credentials.email} password={credentials.password} />}
      </Modal>
    </div>
  );
}

function CourseChecklist({ courses, value, onChange }) {
  if (!courses.length) return <p className="text-sm text-slate-400">Aucun cours dans cet espace.</p>;
  return (
    <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-2">
      {courses.map((c) => (
        <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
            checked={value.includes(c.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, c.id] : value.filter((id) => id !== c.id))}
          />
          <span className="flex-1 text-navy-800">{c.title}</span>
          {!c.is_published && <Badge tone="amber">Brouillon</Badge>}
        </label>
      ))}
    </div>
  );
}

function AddLearnerModal({ open, onClose, courses, companyId, onDone }) {
  const empty = { full_name: '', email: '', job_title: '', password: '' };
  const [form, setForm] = useState(empty);
  const [courseIds, setCourseIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setResult(null);
      setCourseIds(courses.filter((c) => c.is_published).map((c) => c.id));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api('/users', { method: 'POST', body: { ...form, role: 'learner', company_id: companyId, course_ids: courseIds } });
      toast.success('Apprenant ajouté');
      setResult({ email: res.profile.email, password: res.temporary_password || form.password });
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un apprenant" description="Le compte est créé immédiatement, sans email de confirmation.">
      {result ? (
        <div className="space-y-4">
          <CredentialBox email={result.email} password={result.password} />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => { setResult(null); setForm(empty); }}>Ajouter un autre</button>
            <button className="btn-primary" onClick={onClose}>Terminer</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet *"><input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Email *"><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Poste / fonction"><input className="input" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></Field>
            <Field label="Mot de passe" hint="Laisser vide pour en générer un"><input className="input" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          </div>
          <Field label="Inscrire aux cours">
            <CourseChecklist courses={courses} value={courseIds} onChange={setCourseIds} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button className="btn-primary" disabled={saving}>{saving ? <Spinner className="text-white" /> : <><UserPlus className="h-4 w-4" /> Créer le compte</>}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ImportModal({ open, onClose, courses, companyId, onDone }) {
  const [rows, setRows] = useState([]);
  const [courseIds, setCourseIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setRows([]);
      setResult(null);
      setCourseIds(courses.filter((c) => c.is_published).map((c) => c.id));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = parseCSV(await file.text()).map(normalizeImportRow).filter((r) => r.email);
    if (!parsed.length) toast.error('Aucune ligne valide. Colonnes attendues : email, nom/prenom ou full_name, poste.');
    setRows(parsed);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await api('/users/import', { method: 'POST', body: { users: rows, course_ids: courseIds, company_id: companyId } });
      setResult(res);
      toast.success(`${res.created.length} compte(s) créé(s)`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => downloadCSV('modele_import_apprenants.csv', [{ email: 'prenom.nom@entreprise.com', prenom: 'Prénom', nom: 'Nom', poste: 'Commercial' }]);

  return (
    <Modal open={open} onClose={onClose} title="Importer des apprenants" description="Fichier CSV avec les colonnes : email, prenom, nom, poste." size="lg">
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-navy-800"><strong>{result.created.length}</strong> compte(s) créé(s), <strong>{result.errors.length}</strong> erreur(s).</p>
          {result.created.length > 0 && (
            <button className="btn-gold" onClick={() => downloadCSV('identifiants_apprenants.csv', result.created.map((c) => ({ Nom: c.full_name, Email: c.email, 'Mot de passe temporaire': c.temporary_password })))}>
              <Download className="h-4 w-4" /> Télécharger les identifiants
            </button>
          )}
          {result.errors.length > 0 && (
            <ul className="max-h-40 overflow-y-auto rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {result.errors.map((e) => <li key={e.email}>{e.email} : {e.error}</li>)}
            </ul>
          )}
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Terminer</button></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-brand cursor-pointer"><Upload className="h-4 w-4" /> Choisir un fichier CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} /></label>
            <button onClick={downloadTemplate} className="btn-ghost"><Download className="h-4 w-4" /> Télécharger le modèle</button>
          </div>
          {rows.length > 0 && (
            <>
              <div className="max-h-56 overflow-auto rounded-xl ring-1 ring-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="table-th">Email</th><th className="table-th">Nom</th><th className="table-th">Poste</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => <tr key={i}><td className="table-td">{r.email}</td><td className="table-td">{r.full_name}</td><td className="table-td">{r.job_title}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <Field label="Inscrire aux cours"><CourseChecklist courses={courses} value={courseIds} onChange={setCourseIds} /></Field>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn-ghost">Annuler</button>
                <button onClick={submit} disabled={saving} className="btn-primary">{saving ? <Spinner className="text-white" /> : `Importer ${rows.length} apprenant(s)`}</button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
