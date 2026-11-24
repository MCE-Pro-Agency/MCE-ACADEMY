import { useEffect, useRef } from 'react';
import { CheckCircle2, ExternalLink, Lightbulb, Mail, Users, X } from 'lucide-react';
import { BRAND } from '../config';
import { FORMATION_DETAILS } from '../data/formationDetails';

export default function FormationDetails({ formation, formats, onClose }) {
  const dialogRef = useRef(null);
  const details = FORMATION_DETAILS[formation.title];
  const Icon = formation.icon;
  const contactLink = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`Demande d’informations : ${formation.title}`)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="formation-title" aria-describedby="formation-description"
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-4xl overflow-hidden rounded-3xl border-0 bg-white p-0 text-navy-900 shadow-2xl backdrop:bg-navy-950/80 backdrop:backdrop-blur-sm">
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-600">MCE Academy · Fiche formation</p>
          <button type="button" onClick={onClose} autoFocus aria-label="Fermer la fiche formation"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: formation.color }}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h2 id="formation-title" className="text-2xl font-extrabold sm:text-3xl">{formation.title}</h2>
              <p id="formation-description" className="mt-3 leading-relaxed text-slate-600">{formation.text}</p>
            </div>
          </div>

          <div className="mt-7 flex gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-navy-800">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div><h3 className="font-bold">À qui s’adresse ce parcours ?</h3><p className="mt-1 leading-relaxed">{details.audience}</p></div>
          </div>

          <h3 className="mt-8 text-xl font-extrabold">Ce que vous travaillerez</h3>
          <div className="mt-4 space-y-4">
            {formation.topics.map((topic, index) => (
              <article key={topic} className="flex gap-3 rounded-2xl border border-slate-100 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: formation.color }} aria-hidden="true" />
                <div><h4 className="font-bold">{topic}</h4><p className="mt-1 text-sm leading-relaxed text-slate-600">{details.topics[index]}</p></div>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-navy-900 p-5 text-white">
            <h3 className="flex items-center gap-2 font-bold text-accent-300"><Lightbulb className="h-5 w-5 shrink-0" aria-hidden="true" />Exemple de mise en pratique</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-100">{details.practice}</p>
          </div>

          <h3 className="mt-8 text-xl font-extrabold">Un format adapté à votre besoin</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {formats.map(({ title, text, icon: FormatIcon }) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <h4 className="flex items-center gap-2 text-sm font-bold"><FormatIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">Le contenu, la durée et le nombre de participants sont définis avec vous. Les exercices et les supports sont adaptés aux situations de votre organisation.</p>

          <h3 className="mt-8 text-xl font-extrabold">Comment se déroule l’accompagnement ?</h3>
          <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Diagnostic', 'Préciser votre public, vos attentes et les situations à améliorer.'],
              ['Adaptation', 'Choisir les modules, les cas pratiques et les supports utiles.'],
              ['Mise en situation', 'Alterner échanges, exercices guidés et simulations.'],
              ['Restitution', 'Identifier les progrès et les prochaines actions ; une attestation peut être proposée selon le format.'],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-3 p-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{index + 1}</span>
                <div><h4 className="font-bold">{title}</h4><p className="mt-1 leading-relaxed text-slate-600">{text}</p></div>
              </li>
            ))}
          </ol>
          <a href={BRAND.academyUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
            Consulter le catalogue MCE Afrika <ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> (nouvel onglet)</span>
          </a>
        </div>
        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-2 text-xs text-slate-600"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{BRAND.contactEmail}</p>
          <a href={contactLink} className="btn bg-accent-400 text-navy-950 hover:bg-accent-300">Parlons de votre besoin</a>
        </div>
      </div>
    </dialog>
  );
}
