import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchProgressMap } from '../../lib/queries';
import CourseCard from '../../components/CourseCard';
import { EmptyState, PageLoader, Tabs } from '../../components/ui';

export default function Catalog() {
  const { profile, isLearner, activeCompanyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    let query = supabase.from('courses').select('*, lessons(count)').order('created_at', { ascending: false });
    // Aperçu formateur/admin : uniquement les cours publiés de l'entreprise gérée
    if (!isLearner) query = query.eq('is_published', true).eq('company_id', activeCompanyId || profile.company_id);
    const [{ data }, prog] = await Promise.all([query, fetchProgressMap()]);
    setCourses(data || []);
    setProgress(prog);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enroll = async (course) => {
    const { error } = await supabase
      .from('enrollments')
      .upsert({ user_id: profile.id, course_id: course.id }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
    if (error) return toast.error(error.message);
    toast.success(`Inscription confirmée : ${course.title}`);
    load();
  };

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category).filter(Boolean))], [courses]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const p = progress[c.id];
      if (tab === 'progress' && !(p && p.progress_pct > 0 && p.progress_pct < 100)) return false;
      if (tab === 'done' && !(p && p.progress_pct >= 100)) return false;
      if (tab === 'new' && p && p.progress_pct > 0) return false;
      if (category && c.category !== category) return false;
      if (search && !`${c.title} ${c.subtitle || ''} ${c.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [courses, progress, tab, search, category]);

  if (loading) return <PageLoader />;

  const count = (fn) => courses.filter((c) => fn(progress[c.id])).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Mes formations</h1>
        <p className="page-subtitle">Toutes les formations disponibles dans votre espace entreprise.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'Toutes', count: courses.length },
            { value: 'progress', label: 'En cours', count: count((p) => p && p.progress_pct > 0 && p.progress_pct < 100) },
            { value: 'done', label: 'Terminées', count: count((p) => p && p.progress_pct >= 100) },
            { value: 'new', label: 'À découvrir', count: count((p) => !p || p.progress_pct === 0) },
          ]}
        />
        <div className="flex gap-3">
          {categories.length > 1 && (
            <select className="input w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Toutes catégories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" placeholder="Rechercher une formation…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucune formation trouvée" description="Essayez un autre filtre ou revenez plus tard." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              progress={progress[c.id]}
              lessonsCount={c.lessons?.[0]?.count}
              to={`/app/cours/${c.id}`}
              onEnroll={enroll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
