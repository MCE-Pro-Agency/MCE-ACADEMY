import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, HelpCircle, PenLine, Target, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Badge, EmptyState, PageLoader, ProgressBar, StatCard, Tabs } from '../../components/ui';
import { formatDate, scoreColor } from '../../lib/utils';

export default function Grades() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState('quiz');

  useEffect(() => {
    (async () => {
      const [a, s] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('*, lesson:lessons(title), course:courses(title)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('exercise_submissions')
          .select('*, lesson:lessons(title), course:courses(title)')
          .eq('user_id', profile.id)
          .order('submitted_at', { ascending: false }),
      ]);
      setAttempts(a.data || []);
      setSubmissions(s.data || []);
      setLoading(false);
    })();
  }, [profile.id]);

  // Meilleure tentative par quiz
  const bestQuiz = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const cur = map[a.lesson_id];
      if (!cur || Number(a.score) > Number(cur.score)) map[a.lesson_id] = { ...a, tries: (cur?.tries || 0) + 1 };
      else cur.tries += 1;
    });
    return Object.values(map);
  }, [attempts]);

  const quizAvg = bestQuiz.length ? Math.round(bestQuiz.reduce((s, a) => s + Number(a.score), 0) / bestQuiz.length) : null;
  const graded = submissions.filter((s) => s.grade !== null);
  const exAvg = graded.length ? (graded.reduce((s, a) => s + Number(a.grade), 0) / graded.length).toFixed(1) : null;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Mes notes</h1>
        <p className="page-subtitle">Vos résultats aux quiz et les retours de votre formateur sur vos exercices.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Target} label="Moyenne des quiz" value={quizAvg !== null ? `${quizAvg}%` : '—'} />
        <StatCard icon={HelpCircle} label="Quiz réussis" value={`${bestQuiz.filter((q) => q.passed).length}/${bestQuiz.length}`} tone="green" />
        <StatCard icon={Star} label="Moyenne des exercices" value={exAvg !== null ? `${exAvg}/20` : '—'} tone="gold" />
        <StatCard icon={PenLine} label="Exercices corrigés" value={`${graded.length}/${submissions.length}`} tone="navy" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'quiz', label: 'Quiz', icon: HelpCircle, count: bestQuiz.length },
          { value: 'exercises', label: 'Exercices', icon: PenLine, count: submissions.length },
        ]}
      />

      {tab === 'quiz' &&
        (bestQuiz.length === 0 ? (
          <EmptyState icon={Award} title="Aucun quiz passé" description="Vos résultats apparaîtront ici dès votre premier quiz." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {bestQuiz.map((a) => (
              <Link key={a.id} to={`/app/cours/${a.course_id}/lecon/${a.lesson_id}`} className="flex flex-col gap-3 p-5 hover:bg-slate-50 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{a.lesson?.title}</p>
                  <p className="text-xs text-slate-500">{a.course?.title} · {a.tries} tentative{a.tries > 1 ? 's' : ''} · {formatDate(a.created_at)}</p>
                </div>
                <div className="flex items-center gap-4 sm:w-72">
                  <ProgressBar value={a.score} size="sm" className="flex-1" />
                  <span className={`w-12 text-right font-bold ${scoreColor(a.score)}`}>{Math.round(a.score)}%</span>
                  <Badge tone={a.passed ? 'green' : 'amber'}>{a.passed ? 'Réussi' : 'À retenter'}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ))}

      {tab === 'exercises' &&
        (submissions.length === 0 ? (
          <EmptyState icon={PenLine} title="Aucun exercice rendu" description="Rendez vos exercices depuis les leçons de type « Exercice »." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {submissions.map((s) => (
              <Link key={s.id} to={`/app/cours/${s.course_id}/lecon/${s.lesson_id}`} className="card flex gap-4 p-5 transition hover:shadow-lift">
                <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${s.grade !== null ? 'bg-navy-900' : 'bg-slate-100'}`}>
                  {s.grade !== null ? (
                    <>
                      <span className="font-display text-xl font-extrabold text-gold-400">{Number(s.grade)}</span>
                      <span className="text-[10px] text-navy-200">/20</span>
                    </>
                  ) : (
                    <PenLine className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{s.lesson?.title}</p>
                  <p className="text-xs text-slate-500">{s.course?.title}</p>
                  <div className="mt-2">
                    <Badge tone={s.status === 'graded' ? 'gold' : s.status === 'returned' ? 'amber' : 'brand'}>
                      {s.status === 'graded' ? 'Corrigé' : s.status === 'returned' ? 'À reprendre' : 'En attente de correction'}
                    </Badge>
                  </div>
                  {s.feedback && <p className="mt-2 line-clamp-2 text-sm italic text-slate-600">« {s.feedback} »</p>}
                </div>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
