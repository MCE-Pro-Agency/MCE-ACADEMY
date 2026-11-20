export default function ConfigMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
      <div className="max-w-lg rounded-2xl bg-white p-8 shadow-lift">
        <img src="/logo.png" alt="MCE" className="mb-4 h-14 w-14" />
        <h1 className="text-2xl font-bold text-navy-900">Configuration requise</h1>
        <p className="mt-2 text-sm text-slate-600">
          Créez le fichier <code className="rounded bg-slate-100 px-1.5">frontend/.env</code> à partir de{' '}
          <code className="rounded bg-slate-100 px-1.5">.env.example</code> et renseignez :
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-navy-950 p-4 text-xs text-brand-200">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="mt-4 text-sm text-slate-500">Puis relancez <code>npm run dev</code>. Voir le README pour le guide complet.</p>
      </div>
    </div>
  );
}
