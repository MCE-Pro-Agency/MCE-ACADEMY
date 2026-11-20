import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { EmptyState, Field, PageLoader } from '../../components/ui';
import { formatDateTime } from '../../lib/utils';

export default function Announcements() {
  const { activeCompanyId, profile } = useAuth();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });

  const load = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles(full_name)')
      .eq('company_id', activeCompanyId)
      .order('created_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => {
    if (activeCompanyId) load();
  }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const publish = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('announcements').insert({ ...form, company_id: activeCompanyId, author_id: profile.id });
    if (error) return toast.error(error.message);
    setForm({ title: '', body: '' });
    toast.success('Annonce publiée sur le tableau de bord des apprenants');
    load();
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  };

  if (!items) return <PageLoader />;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <h1 className="page-title">Annonces</h1>
        <p className="page-subtitle">Communiquez avec tous les apprenants de l’entreprise.</p>
        <form onSubmit={publish} className="card mt-6 space-y-4 p-6">
          <Field label="Titre"><input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Message"><textarea className="input min-h-[140px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
          <button className="btn-primary w-full"><Send className="h-4 w-4" /> Publier</button>
        </form>
      </div>
      <div className="space-y-4 lg:col-span-3">
        {items.length === 0 ? (
          <EmptyState icon={Megaphone} title="Aucune annonce" description="Vos annonces apparaîtront sur le tableau de bord des apprenants." />
        ) : (
          items.map((a) => (
            <article key={a.id} className="card border-l-4 border-l-brand-400 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-navy-900">{a.title}</h3>
                  <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}{a.author?.full_name ? ` · ${a.author.full_name}` : ''}</p>
                </div>
                <button onClick={() => remove(a.id)} className="btn-ghost btn-sm text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              {a.body && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{a.body}</p>}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
