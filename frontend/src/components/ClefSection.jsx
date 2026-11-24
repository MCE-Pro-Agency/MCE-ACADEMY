import { useState } from 'react';
import { CLEF_PRINCIPLES } from '../data/clef';
import ClefDetails from './ClefDetails';

export default function ClefSection() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <section id="clef" className="public-clef">
      <div className="public-wrap">
        <div className="public-clef-heading"><div><p className="public-eyebrow">La méthode MCE</p><h2 className="public-display">La méthode C.L.E.F.</h2></div><p>Quatre gestes complémentaires pour mieux manager : donner un cap, écouter, poser un cadre juste et développer l’autonomie.</p></div>
        <ol className="public-clef-principles">{CLEF_PRINCIPLES.map(({ letter, title, action }) => <li key={letter}><span aria-hidden="true">{letter}</span><h3>{title}</h3><p>{action}</p></li>)}</ol>
        <div className="public-clef-action"><p>C.L.E.F. · Une méthode à mettre en pratique.</p><button type="button" className="public-button public-button-light" aria-haspopup="dialog" onClick={() => setDetailsOpen(true)}>En savoir plus<span className="sr-only"> sur la méthode C.L.E.F.</span></button></div>
      </div>
      {detailsOpen && <ClefDetails onClose={() => setDetailsOpen(false)} />}
    </section>
  );
}
