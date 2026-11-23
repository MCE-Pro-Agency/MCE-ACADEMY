import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Save, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, uploadMedia } from '../../lib/db';
import { Field, PageLoader } from '../../components/ui';

export default function CompanySettings() {
  const { activeCompanyId, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!activeCompanyId) return;
    db.from('companies').select('*').eq('id', activeCompanyId).single().then(({ data }) => setForm(data));
  }, [activeCompanyId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set('logo_url', await uploadMedia(file, `companies/${activeCompanyId}`));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const { name, sector, contact_email, logo_url } = form;
    const { error } = await db.from('companies').update({ name, sector, contact_email, logo_url }).eq('id', activeCompanyId);
    if (error) return toast.error(error.message);
    toast.success('Entreprise mise à jour');
    refreshProfile();
  };

  if (!form) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Mon entreprise</h1>
        <p className="page-subtitle">Informations de l’espace de formation.</p>
      </div>
      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
            {form.logo_url ? <img src={form.logo_url} alt="" className="h-full w-full object-contain" /> : <Building2 className="h-8 w-8 text-slate-300" />}
          </div>
          <label className="btn-secondary cursor-pointer"><Upload className="h-4 w-4" /> Logo de l’entreprise<input type="file" accept="image/*" className="hidden" onChange={uploadLogo} /></label>
        </div>
        <Field label="Nom de l’entreprise"><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Secteur"><input className="input" value={form.sector || ''} onChange={(e) => set('sector', e.target.value)} /></Field>
          <Field label="Email de contact"><input type="email" className="input" value={form.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} /></Field>
        </div>
        {form.max_learners && <p className="text-sm text-slate-500">Licence : jusqu’à <strong>{form.max_learners}</strong> apprenants.</p>}
        <div className="flex justify-end"><button className="btn-primary"><Save className="h-4 w-4" /> Enregistrer</button></div>
      </form>
    </div>
  );
}
