import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import { BRAND } from '../../config';

export default function Certificate() {
  const { courseId } = useParams();
  const { profile, company } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ data: course }, { data: enr }] = await Promise.all([
        supabase.from('courses').select('title, estimated_minutes').eq('id', courseId).single(),
        supabase.from('enrollments').select('completed_at').eq('course_id', courseId).eq('user_id', profile.id).maybeSingle(),
      ]);
      setData({ course, completedAt: enr?.completed_at });
    })();
  }, [courseId, profile.id]);

  if (!data) return <PageLoader />;

  if (!data.completedAt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-2xl bg-slate-100 p-4"><Lock className="h-8 w-8 text-slate-400" /></div>
        <h1 className="text-xl font-bold text-navy-900">Certificat non disponible</h1>
        <p className="max-w-sm text-sm text-slate-500">Terminez toutes les leçons de la formation pour débloquer votre certificat.</p>
        <Link to={`/app/cours/${courseId}`} className="btn-primary">Retour à la formation</Link>
      </div>
    );
  }

  const certId = `MCE-${courseId.slice(0, 4).toUpperCase()}-${profile.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-5xl items-center justify-between px-4">
        <Link to={`/app/cours/${courseId}`} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer className="h-4 w-4" /> Imprimer / PDF</button>
      </div>

      <div className="mx-auto aspect-[1.414/1] max-w-5xl bg-white p-3 shadow-lift print:shadow-none">
        <div className="relative flex h-full flex-col items-center justify-between overflow-hidden border-[3px] border-navy-800 p-10 text-center">
          <div className="pointer-events-none absolute inset-2 border border-gold-400" />
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-50" />
          <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-brand-50" />

          <div className="relative flex flex-col items-center">
            <img src="/logo.png" alt="MCE" className="h-20 w-20 object-contain" />
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-navy-500">MCE Academy</p>
          </div>

          <div className="relative">
            <p className="font-display text-sm font-bold uppercase tracking-[0.35em] text-brand-500">Certificat de réussite</p>
            <p className="mt-6 text-sm text-slate-500">Ce certificat est décerné à</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-navy-900 sm:text-5xl">{profile.full_name}</p>
            <div className="mx-auto my-5 h-0.5 w-24 bg-gold-500" />
            <p className="text-sm text-slate-500">pour avoir suivi avec succès la formation</p>
            <p className="mt-2 font-display text-2xl font-bold text-navy-800">{data.course?.title}</p>
            {company && <p className="mt-2 text-sm text-slate-500">{company.name}</p>}
          </div>

          <div className="relative flex w-full items-end justify-between text-left text-xs text-slate-500">
            <div>
              <p className="font-semibold text-navy-800">Délivré le {formatDate(data.completedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>N° {certId}</p>
            </div>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-center text-navy-950 shadow-lg ring-4 ring-gold-100">
              <span className="text-[9px] font-bold uppercase tracking-wider">Certifié</span>
              <span className="font-display text-lg font-extrabold">MCE</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-navy-800">{BRAND.company}</p>
              <p>{BRAND.baseline}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
