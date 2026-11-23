/* Mes documents : supports de formation, documents personnels et contenus par module */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Lock, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { PageLoader } from '../../components/ui';
import { profilStore, lastRun, useLocalStoreVersion } from '../../lib/stores';
import { downloadAttestationPdf, downloadProfilPdf } from '../../lib/pdf';
import * as profilModel from '../../data/profilModel';
import { formatMinutes } from '../../lib/utils';

const ICONS = { support: '📘', livret: '📗', ebook: '📖', attestation: '🎓', autre: '📄' };

function DocRow({ icon, title, description, status, action }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl ring-1 ring-slate-100">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy-900">{title}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
        {status && <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Clock className="h-3.5 w-3.5" /> {status}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

const DownloadLink = ({ href, name }) => (
  <a href={href} download={name} target="_blank" rel="noreferrer" className="btn-brand btn-sm"><Download className="h-4 w-4" /> Télécharger</a>
);
const Unavailable = ({ label }) => <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"><Lock className="h-3.5 w-3.5" /> {label}</span>;

export default function Documents() {
  const { profile, company } = useAuth();
  useLocalStoreVersion({ refresh: true });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    (async () => {
      const [docs, enr] = await Promise.all([
        db.from('documents').select('*').order('created_at'),
        db.from('enrollments').select('course_id, completed_at, course:courses(id, title, estimated_minutes)').eq('user_id', profile.id),
      ]);
      setData({ docs: docs.data || [], enrollments: (enr.data || []).filter((e) => e.course) });
    })();
  }, [profile.id]);

  if (!data) return <PageLoader />;

  const common = data.docs.filter((d) => !d.user_id);
  const mine = data.docs.filter((d) => d.user_id === profile.id);
  const ebook = mine.find((d) => d.kind === 'ebook');
  const attestationFile = mine.find((d) => d.kind === 'attestation');
  const others = mine.filter((d) => !['ebook', 'attestation'].includes(d.kind));
  const p = profilStore.get(profile.id);
  const run = lastRun(p);
  const done = data.enrollments.find((e) => e.completed_at);

  const run_ = async (key, fn) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error(e?.message || 'Téléchargement impossible.'); } finally { setBusy(null); }
  };
  const btn = (key, fn) => (
    <button onClick={() => run_(key, fn)} className="btn-brand btn-sm" disabled={busy === key}>
      {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Télécharger
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Mon espace</p>
        <h1 className="page-title">Mes documents</h1>
        <p className="page-subtitle">Tous vos documents à télécharger.</p>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-navy-900">Supports de formation</h2>
        <div className="divide-y divide-slate-100">
          {common.map((d) => (
            <DocRow key={d.id} icon={ICONS[d.kind]} title={d.title} description={d.description} action={<DownloadLink href={d.file_url} name={d.title} />} />
          ))}
          {common.length === 0 && <p className="p-5 text-sm text-slate-500">Les supports seront mis à disposition par votre formateur.</p>}
        </div>
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-navy-900">Mes documents personnels</h2>
        <div className="divide-y divide-slate-100">
          <DocRow
            icon="🧩"
            title="Mon rapport de profil professionnel"
            description="Scores, style de fonctionnement, motivations et plan d’action"
            status={!run ? 'Disponible après votre test de profil' : null}
            action={run ? btn('profil', () => downloadProfilPdf({ run, name: profile.full_name, comment: p.comment, model: profilModel })) : <Link to="/app/mon-profil" className="btn-secondary btn-sm">Passer le test</Link>}
          />
          <DocRow
            icon="🎓"
            title="Mon attestation MCE"
            description="Remise après la formation"
            status={!attestationFile && !done ? 'Disponible après la formation' : null}
            action={
              attestationFile ? <DownloadLink href={attestationFile.file_url} name={attestationFile.title} />
                : done ? btn('attestation', () => downloadAttestationPdf({
                    name: profile.full_name, courseTitle: done.course.title, company: company?.name, completedAt: done.completed_at,
                    hours: done.course.estimated_minutes ? formatMinutes(done.course.estimated_minutes) : null,
                    certId: `MCE-${done.course_id.slice(0, 4).toUpperCase()}-${profile.id.slice(0, 6).toUpperCase()}`,
                  }))
                : <Unavailable label="Disponible après la formation" />
            }
          />
          <DocRow
            icon="📖"
            title="Mon e-book individuel"
            description="Préparé par MCE selon le calendrier"
            status={!ebook ? 'En préparation par MCE' : null}
            action={ebook ? <DownloadLink href={ebook.file_url} name={ebook.title} /> : <Unavailable label="En préparation" />}
          />
          {others.map((d) => (
            <DocRow key={d.id} icon={ICONS[d.kind]} title={d.title} description={d.description} action={<DownloadLink href={d.file_url} name={d.title} />} />
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><BookOpen className="h-6 w-6" /></span>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-navy-900">Mes contenus par module</h2>
          <p className="text-sm text-slate-500">Les leçons, mémos, exercices et quiz se téléchargent un par un dans chaque module, dès que votre formateur l’a ouvert.</p>
        </div>
        <Link to={data.enrollments[0] ? `/app/cours/${data.enrollments[0].course_id}` : '/app/catalogue'} className="btn-primary">📚 Aller à Mes modules</Link>
      </section>
    </div>
  );
}
