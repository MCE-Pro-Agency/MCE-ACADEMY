import { Link } from 'react-router-dom';
import { BookOpen, Clock, Layers, CheckCircle2, GraduationCap } from 'lucide-react';
import { Badge, ProgressBar } from './ui';
import { formatMinutes, LEVEL_LABELS, cn } from '../lib/utils';

const GRADIENTS = [
  'from-navy-800 via-navy-700 to-brand-600',
  'from-brand-600 via-brand-500 to-brand-300',
  'from-navy-900 via-brand-800 to-brand-500',
  'from-navy-700 via-navy-600 to-brand-400',
];

export function CourseCover({ course, className, children }) {
  const g = GRADIENTS[(course?.title?.length || 0) % GRADIENTS.length];
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {course?.cover_url ? (
        <img src={course.cover_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', g)}>
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <GraduationCap className="relative h-12 w-12 text-white/80" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function CourseCard({ course, progress, to, lessonsCount, onEnroll }) {
  const pct = progress?.progress_pct ?? null;
  const enrolled = progress !== undefined && progress !== null;
  const done = pct >= 100;

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <Link to={to}>
        <CourseCover course={course} className="aspect-[16/9]">
          <div className="absolute left-3 top-3 flex gap-1.5">
            {course.category && <Badge tone="navy" className="bg-navy-900/80 backdrop-blur">{course.category}</Badge>}
          </div>
          {done && (
            <div className="absolute right-3 top-3">
              <Badge tone="gold" icon={CheckCircle2}>Terminé</Badge>
            </div>
          )}
        </CourseCover>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to={to}>
          <h3 className="line-clamp-2 font-bold text-navy-900 transition group-hover:text-brand-600">{course.title}</h3>
        </Link>
        {course.subtitle && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.subtitle}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {LEVEL_LABELS[course.level]}</span>
          {lessonsCount !== undefined && <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {lessonsCount} leçons</span>}
          {course.estimated_minutes > 0 && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatMinutes(course.estimated_minutes)}</span>}
        </div>

        <div className="mt-auto pt-5">
          {enrolled ? (
            <>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-medium text-slate-500">{done ? 'Formation terminée' : pct > 0 ? 'En cours' : 'Pas encore commencé'}</span>
                <span className="font-bold text-navy-800">{pct}%</span>
              </div>
              <ProgressBar value={pct} size="sm" />
            </>
          ) : onEnroll ? (
            <button onClick={() => onEnroll(course)} className="btn-brand w-full">S’inscrire gratuitement</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
