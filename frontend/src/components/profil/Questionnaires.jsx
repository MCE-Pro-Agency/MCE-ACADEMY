/* Questionnaire du profil professionnel MCE (≈ 25 min, 13 étapes) */
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PM, PROFIL_STEPS, stepIds, scoreProfil, DIM_COLORS, CONTEXT, PREFERENCES, AXES } from '../../data/profilModel';
import { profilStore } from '../../lib/stores';
import { cn } from '../../lib/utils';

const LIKERT_COLORS = ['#EF4444', '#F97316', '#94A3B8', '#38BDF8', '#10B981'];
const STEP_META = {
  context: { title: 'Votre contexte professionnel', sub: 'Trois questions pour situer votre fonction. Elles ne sont pas notées.', color: '#30567E' },
  preferences: { title: 'Votre manière de fonctionner', sub: 'Choisissez l’option qui vous ressemble le plus, même si les deux vous parlent. Aucune n’est meilleure.', color: '#C9A227' },
  objective: { title: 'Votre objectif personnel', sub: 'Dernière étape : ce que vous souhaitez développer en priorité.', color: '#10B981' },
};

function Choice({ selected, onClick, children, color = '#112842' }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition', selected ? 'text-white shadow ring-transparent' : 'bg-white text-navy-800 ring-slate-200 hover:ring-brand-300')}
      style={selected ? { background: color } : undefined}
    >
      {children}
    </button>
  );
}

export function ProfilQuestionnaire({ userId, onDone, onCancel }) {
  const stored = profilStore.get(userId);
  const [d, setD] = useState(() => stored.draft || { answers: {}, pos: 0, startedAt: new Date().toISOString() });
  const st = PROFIL_STEPS[d.pos];
  const pct = Math.round((d.pos / PROFIL_STEPS.length) * 100);
  const meta = st.type === 'module' ? { title: st.dim.title, sub: st.dim.definition, color: DIM_COLORS[st.dim.id] } : STEP_META[st.type];

  const update = (next) => {
    setD(next);
    profilStore.saveDraft(userId, next);
  };
  const setAns = (id, v) => update({ ...d, answers: { ...d.answers, [id]: v } });
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const move = (dir) => {
    if (dir < 0) {
      if (d.pos === 0) return onCancel();
      update({ ...d, pos: d.pos - 1 });
      return top();
    }
    const missing = stepIds(st).filter((id) => d.answers[id] === undefined).length;
    if (missing) return toast.error(`Merci de répondre aux ${missing} question(s) restante(s).`);
    if (d.pos < PROFIL_STEPS.length - 1) {
      update({ ...d, pos: d.pos + 1 });
      return top();
    }
    const minutes = Math.max(1, Math.round((Date.now() - new Date(d.startedAt)) / 60000));
    const result = scoreProfil(d.answers, minutes);
    profilStore.addRun(userId, { date: new Date().toISOString(), minutes, version: PM.version, answers: d.answers, result });
    toast.success('Votre profil est prêt ! 🎉');
    onDone();
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative overflow-hidden p-6 text-white transition-colors duration-500" style={{ background: `linear-gradient(135deg, ${meta.color}, #0B1D33)` }}>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/80">
          <span>Étape {d.pos + 1} sur {PROFIL_STEPS.length}</span>
          <span>{pct} % · enregistré automatiquement</span>
        </div>
        <h2 className="mt-2 text-2xl font-extrabold">{meta.title}</h2>
        <p className="mt-1 text-sm text-white/80">{meta.sub}</p>
        <div className="mt-5 flex gap-1.5">
          {PROFIL_STEPS.map((s, i) => (
            <span
              key={i}
              className={cn('h-2 flex-1 rounded-full transition-all', i === d.pos && 'ring-2 ring-white')}
              style={{ background: i <= d.pos ? (s.type === 'module' ? DIM_COLORS[s.dim.id] : STEP_META[s.type].color) : 'rgba(255,255,255,.2)' }}
              title={s.type === 'module' ? s.dim.title : STEP_META[s.type].title}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {st.type === 'context' &&
          CONTEXT.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-navy-900">{c.question}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {c.options.map((o, k) => <Choice key={o} selected={d.answers[c.id] === k} onClick={() => setAns(c.id, k)} color="#30567E">{o}</Choice>)}
              </div>
            </div>
          ))}

        {st.type === 'module' && (
          <>
            {st.questions.map((q, i) => (
              <div key={q.id} className={cn('rounded-2xl border p-4 transition animate-fade-in', d.answers[q.id] ? 'border-transparent bg-slate-50' : 'border-slate-200')} style={{ animationDelay: `${i * 40}ms` }}>
                <p className="text-sm font-semibold text-navy-900"><span className="text-slate-400">{i + 1}.</span> {q.text}</p>
                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-5">
                  {PM.likert.map((l, k) => {
                    const sel = d.answers[q.id] === k + 1;
                    return (
                      <button key={l} onClick={() => setAns(q.id, k + 1)}
                        className={cn('rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition', sel ? 'scale-[1.03] text-white shadow ring-transparent' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300')}
                        style={sel ? { background: LIKERT_COLORS[k] } : undefined}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/60 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Mise en situation professionnelle</p>
              <p className="mt-1 font-semibold text-navy-900">{st.situation.text}</p>
              <div className="mt-3 space-y-2">
                {st.situation.options.map((o, k) => {
                  const sel = d.answers[st.situation.id] === o.id;
                  return (
                    <button key={o.id} onClick={() => setAns(st.situation.id, o.id)}
                      className={cn('flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ring-1 transition', sel ? 'bg-navy-800 text-white ring-transparent shadow' : 'bg-white text-navy-800 ring-slate-200 hover:ring-amber-300')}>
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', sel ? 'bg-white text-navy-800' : 'bg-slate-100 text-slate-500')}>{'ABCD'[k]}</span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {st.type === 'preferences' &&
          PREFERENCES.map((p, i) => {
            const ax = AXES.find((a) => a.id === p.axis);
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-navy-900">{i + 1}. {p.question}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.options.map((o, k) => (
                    <Choice key={o} selected={d.answers[p.id] === k} onClick={() => setAns(p.id, k)} color={k === 0 ? '#6366F1' : '#F59E0B'}>
                      <span className="mr-1">{k === 0 ? ax.ia : ax.ib}</span> {o}
                    </Choice>
                  ))}
                </div>
              </div>
            );
          })}

        {st.type === 'objective' && (
          <>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-navy-900">⭐ Quelle compétence souhaitez-vous surtout développer ?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PM.dimensions.map((dim) => (
                  <Choice key={dim.id} selected={d.answers.OBJ_DIM === dim.id} onClick={() => setAns('OBJ_DIM', dim.id)} color={DIM_COLORS[dim.id]}>
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: DIM_COLORS[dim.id] }} />{dim.title}
                  </Choice>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-navy-900">Qu’attendez-vous concrètement de cette formation ? <span className="font-normal text-slate-400">(facultatif)</span></p>
              <textarea rows={3} value={d.answers.OBJ_TEXT || ''} onChange={(e) => setAns('OBJ_TEXT', e.target.value)} className="input mt-3" placeholder="Ex. : être plus à l’aise pour présenter les résultats de mon équipe" />
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <button onClick={() => move(-1)} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> {d.pos === 0 ? 'Plus tard' : 'Précédent'}</button>
          <button onClick={() => move(1)} className="btn-brand px-6">
            {d.pos === PROFIL_STEPS.length - 1 ? <><Sparkles className="h-4 w-4" /> Découvrir mon profil</> : <>Continuer <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
