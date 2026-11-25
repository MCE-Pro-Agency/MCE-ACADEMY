import { useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { CLEF_APPLICATIONS, CLEF_FOLLOW_UP, CLEF_PRINCIPLES } from '../data/clef';

export default function ClefDetails({ onClose, focusLetter = null }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    // Ouvre la fiche directement sur le repère demandé (« En savoir plus » d'une carte).
    if (focusLetter) {
      requestAnimationFrame(() => dialog.querySelector(`#clef-detail-${focusLetter}`)?.closest('section')?.scrollIntoView({ block: 'start' }));
    }
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="clef-title" aria-describedby="clef-description"
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-4xl overflow-hidden rounded-3xl border-0 bg-white p-0 text-navy-900 shadow-2xl backdrop:bg-navy-950/80 backdrop:backdrop-blur-sm">
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">La méthode MCE</p>
          <button type="button" onClick={onClose} autoFocus aria-label="Fermer les détails C.L.E.F."
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto px-5 py-7 sm:px-10 sm:py-10">
          <p className="text-sm font-semibold text-brand-700">Comprendre · Pratiquer · Progresser</p>
          <h2 id="clef-title" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">La méthode C.L.E.F.</h2>
          <p id="clef-description" className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">Quatre gestes complémentaires pour donner du sens à l’action, construire des relations de travail plus claires et développer l’autonomie de son équipe.</p>

          <section className="mt-8 border-y border-slate-200 py-6" aria-labelledby="clef-posture">
            <h3 id="clef-posture" className="text-lg font-bold">Organiser l’action et donner du sens</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Le manager fixe des objectifs, organise les moyens et suit les engagements. Le leader donne une direction, inspire confiance et mobilise les énergies. Ces deux rôles se complètent : C.L.E.F. aide à les traduire en gestes concrets au quotidien.</p>
          </section>

          <div>
            {CLEF_PRINCIPLES.map(({ letter, title, action, description, practices, example, question, exercise }) => (
              <section key={letter} className="border-b border-slate-200 py-8 sm:grid sm:grid-cols-[64px_1fr] sm:gap-6" aria-labelledby={`clef-detail-${letter}`}>
                <span className="mb-3 block font-display text-5xl font-extrabold leading-none text-brand-600 sm:mb-0" aria-hidden="true">{letter}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{action}</p>
                  <h3 id={`clef-detail-${letter}`} className="mt-1 text-2xl font-extrabold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                  <ul className="mt-4 space-y-3">
                    {practices.map((practice) => <li key={practice} className="flex gap-2.5 text-sm leading-relaxed"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />{practice}</li>)}
                  </ul>
                  <div className="mt-5 border-l-2 border-brand-400 pl-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700">Exemple de mise en pratique</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{example}</p>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed"><span className="font-bold">À se demander : </span><span className="text-slate-600">{question}</span></p>
                  <p className="mt-2 text-sm leading-relaxed"><span className="font-bold">À tester : </span><span className="text-slate-600">{exercise}</span></p>
                </div>
              </section>
            ))}
          </div>

          <section className="pt-9" aria-labelledby="clef-applications">
            <h3 id="clef-applications" className="text-2xl font-extrabold">Des outils pour les situations du quotidien</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Retrouvez les repères à appliquer selon les situations que vous rencontrez.</p>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {CLEF_APPLICATIONS.map(({ title, text, action }) => (
                <details key={title} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
                    {title}<ChevronDown className="h-4 w-4 shrink-0 text-brand-600 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{text}</p>
                  <p className="mt-3 text-sm leading-relaxed"><span className="font-bold text-brand-700">À essayer : </span>{action}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-9 rounded-2xl bg-navy-900 p-5 text-white sm:p-7" aria-labelledby="clef-progress">
            <h3 id="clef-progress" className="text-xl font-bold">Ancrer les progrès sur 30 jours</h3>
            <p className="mt-3 text-sm leading-relaxed text-navy-100">Choisissez une action, un signe de progrès observable et une date. Ces étapes permettent de prolonger la mise en pratique après la formation.</p>
            <ol className="mt-6 space-y-5">
              {CLEF_FOLLOW_UP.map(({ day, title, text }) => (
                <li key={day} className="flex items-start gap-4">
                  <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-accent-300">{day}</span>
                  <div><h4 className="text-sm font-bold">{title}</h4><p className="mt-1 text-sm leading-relaxed text-navy-100">{text}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </dialog>
  );
}
