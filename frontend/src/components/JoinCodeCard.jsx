import {useAdminConfirm} from './layout/AdminConfirm';
/* Code d'inscription de l'entreprise (formateur / admin) : à transmettre aux apprenants
   avec le lien d'inscription. Chaque apprenant inscrit avec ce code est rattaché à l'entreprise. */
import { useEffect, useState } from 'react';
import { Copy, RefreshCw, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/db';

const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

export default function JoinCodeCard({ companyId }) {
  const ask=useAdminConfirm();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (companyId) db.from('companies').select('id, name, join_code').eq('id', companyId).single().then(({ data }) => setCompany(data));
  }, [companyId]);

  if (!company) return null;
  const link = `${window.location.origin}/inscription?code=${company.join_code || ''}`;
  const copy = async (text, msg) => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };
  const regenerate = async () => {
    if (!await ask('Créer un nouveau code ? L’ancien code et l’ancien lien ne fonctionneront plus.')) return;
    const code = newCode();
    const { error } = await db.from('companies').update({ join_code: code }).eq('id', company.id);
    if (error) return toast.error(error.message);
    setCompany({ ...company, join_code: code });
    toast.success('Nouveau code créé');
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-navy-900 to-navy-700 p-6 text-white lg:flex-row lg:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><UserPlus className="h-6 w-6" /></span>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Inscription des apprenants · {company.name}</p>
        {company.join_code ? (
          <p className="mt-1 text-sm text-navy-100">
            Envoyez ce lien à vos apprenants : ils créent leur compte puis passent leur test de profil.
            <br />Code : <span className="font-mono text-lg font-bold tracking-widest text-white">{company.join_code}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-navy-100">Aucun code d’inscription : créez-en un pour permettre l’inscription des apprenants.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {company.join_code && (
          <button onClick={() => copy(link, 'Lien d’inscription copié')} className="btn-brand"><Copy className="h-4 w-4" /> Copier le lien</button>
        )}
        <button onClick={regenerate} className="btn bg-white/10 text-white hover:bg-white/20"><RefreshCw className="h-4 w-4" /> {company.join_code ? 'Nouveau code' : 'Créer un code'}</button>
      </div>
    </div>
  );
}
