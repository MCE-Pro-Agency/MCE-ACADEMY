import {useAdminConfirm} from '../../components/layout/AdminConfirm';
/* Documents des apprenants (formateur / admin)
   - supports communs (diaporama, livret…) : mise à disposition ou retrait
   - documents personnels : e-book individuel, attestation, autre fichier par apprenant */
import { useEffect, useState } from 'react';
import { Download, Eye, EyeOff, FilePlus2, Loader2, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db, uploadMedia } from '../../lib/db';
import { Avatar, Field, Modal, PageLoader } from '../../components/ui';
import { cn, formatDate } from '../../lib/utils';

const KINDS = {
  support: { label: 'Support de formation', icon: '📘' },
  livret: { label: 'Livret / mémos', icon: '📗' },
  ebook: { label: 'E-book individuel', icon: '📖' },
  attestation: { label: 'Attestation', icon: '🎓' },
  autre: { label: 'Autre document', icon: '📄' },
};

export default function TrainerDocuments() {
  const ask=useAdminConfirm();
  const { activeCompanyId } = useAuth();
  const [docs, setDocs] = useState(null);
  const [learners, setLearners] = useState([]);
  const [modal, setModal] = useState(null); // { user } ou { common: true }

  const load = async () => {
    const [d, l] = await Promise.all([
      db.from('documents').select('*').eq('company_id', activeCompanyId).order('created_at'),
      db.from('profiles').select('id, full_name, job_title, avatar_url').eq('company_id', activeCompanyId).eq('role', 'learner').order('full_name'),
    ]);
    setDocs(d.data || []);
    setLearners(l.data || []);
  };
  useEffect(() => {
    if (activeCompanyId) load();
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!docs) return <PageLoader />;

  const toggle = async (d) => {
    const { error } = await db.from('documents').update({ is_available: !d.is_available }).eq('id', d.id);
    if (error) return toast.error(error.message);
    toast.success(d.is_available ? 'Document retiré de l’espace apprenant' : 'Document mis à disposition');
    load();
  };
  const remove = async (d) => {
    if (!await ask(`Supprimer « ${d.title} » ?`)) return;
    const { error } = await db.from('documents').delete().eq('id', d.id);
    if (error) return toast.error(error.message);
    load();
  };

  const common = docs.filter((d) => !d.user_id);
  const personal = (uid) => docs.filter((d) => d.user_id === uid);

  const Row = ({ d }) => (
    <div className={cn('flex items-center gap-3 px-5 py-3', !d.is_available && 'opacity-60')}>
      <span className="text-xl">{KINDS[d.kind]?.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy-900">{d.title}</p>
        <p className="truncate text-xs text-slate-400">{KINDS[d.kind]?.label}{d.description ? ` · ${d.description}` : ''} · ajouté le {formatDate(d.created_at)}</p>
      </div>
      <a href={d.file_url} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Télécharger"><Download className="h-4 w-4" /></a>
      <button onClick={() => toggle(d)} className="btn-ghost btn-sm" title={d.is_available ? 'Retirer de l’espace apprenant' : 'Mettre à disposition'}>
        {d.is_available ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={() => remove(d)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Espace « Mes documents »</p>
          <h1 className="page-title">Documents des apprenants</h1>
          <p className="page-subtitle">Mettez les supports à disposition et déposez les e-books et attestations individuels.</p>
        </div>
        <button onClick={() => setModal({ common: true })} className="btn-primary"><FilePlus2 className="h-4 w-4" /> Ajouter un support</button>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-navy-900">Supports de formation (tous les apprenants)</h2>
        <div className="divide-y divide-slate-100">
          {common.map((d) => <Row key={d.id} d={d} />)}
          {!common.length && <p className="p-5 text-sm text-slate-500">Aucun support.</p>}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-navy-900">Documents personnels</h2>
          <p className="text-sm text-slate-500">Le rapport de profil est généré automatiquement ; l’attestation aussi, dès que la formation est terminée. Déposez ici un e-book ou une attestation signée.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {learners.map((l) => {
            const list = personal(l.id);
            const hasEbook = list.some((d) => d.kind === 'ebook');
            return (
              <div key={l.id}>
                <div className="flex items-center gap-3 bg-slate-50/60 px-5 py-3">
                  <Avatar name={l.full_name} src={l.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-900">{l.full_name}</p>
                    <p className="text-xs text-slate-400">{l.job_title || '—'} · {hasEbook ? '📖 e-book déposé' : '📖 e-book en préparation'}</p>
                  </div>
                  <button onClick={() => setModal({ user: l })} className="btn-secondary btn-sm"><Upload className="h-3.5 w-3.5" /> Déposer</button>
                </div>
                {list.map((d) => <Row key={d.id} d={d} />)}
              </div>
            );
          })}
          {!learners.length && <p className="p-5 text-sm text-slate-500">Aucun apprenant.</p>}
        </div>
      </section>

      <UploadModal
        open={Boolean(modal)}
        target={modal}
        companyId={activeCompanyId}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); }}
      />
    </div>
  );
}

function UploadModal({ open, target, companyId, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({ kind: target?.common ? 'support' : 'ebook', title: target?.common ? '' : `E-book individuel — ${target?.user?.full_name}`, description: '', is_available: true });
      setFile(null);
    }
  }, [open, target]);

  const save = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choisissez un fichier.');
    setBusy(true);
    try {
      const url = await uploadMedia(file, 'documents');
      const { error } = await db.from('documents').insert({
        company_id: companyId,
        user_id: target?.user?.id || null,
        kind: form.kind,
        title: form.title || file.name,
        description: form.description || null,
        file_url: url,
        is_available: form.is_available,
      });
      if (error) throw error;
      toast.success('Document ajouté');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const kinds = target?.common ? ['support', 'livret', 'autre'] : ['ebook', 'attestation', 'autre'];
  return (
    <Modal open={open} onClose={onClose} title={target?.common ? 'Ajouter un support de formation' : `Document pour ${target?.user?.full_name || ''}`}
      footer={<><button type="button" onClick={onClose} className="btn-ghost">Annuler</button><button form="doc-form" className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer</button></>}>
      <form id="doc-form" onSubmit={save} className="space-y-4">
        <Field label="Type de document">
          <select value={form.kind || ''} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="input">
            {kinds.map((k) => <option key={k} value={k}>{KINDS[k].icon} {KINDS[k].label}</option>)}
          </select>
        </Field>
        <Field label="Titre"><input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></Field>
        <Field label="Description (facultatif)"><input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Ex. : Diaporama de la formation (PDF)" /></Field>
        <Field label="Fichier" hint="PDF, Word, PowerPoint, image…">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" checked={!!form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
          Visible immédiatement par {target?.common ? 'les apprenants' : 'l’apprenant'}
        </label>
      </form>
    </Modal>
  );
}
