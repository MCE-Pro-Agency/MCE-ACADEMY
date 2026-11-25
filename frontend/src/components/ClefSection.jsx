import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, Ear, KeyRound, Scale, Sprout } from 'lucide-react';
import { CLEF_PRINCIPLES } from '../data/clef';
import ClefDetails from './ClefDetails';
import useInView from './useInView';

const ICONS = { C: Compass, L: Ear, E: Scale, F: Sprout };
const DELAY = 3500;

export default function ClefSection() {
  const [details, setDetails] = useState(null); // null = fermé, sinon lettre à afficher (ou 'all')
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ref, visible] = useInView(0.2);
  const reducedMotion = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // Les repères s'allument l'un après l'autre tant que la section est visible.
  useEffect(() => {
    if (!visible || paused || details || reducedMotion.current) return undefined;
    const timer = setTimeout(() => setActive((current) => (current + 1) % CLEF_PRINCIPLES.length), DELAY);
    return () => clearTimeout(timer);
  }, [visible, paused, details, active]);

  const focusCard = useCallback((index) => { setActive(index); setPaused(true); }, []);
  const progress = (active / (CLEF_PRINCIPLES.length - 1)) * 100;

  return (
    <section id="clef" ref={ref} className={`lx-clef-section${visible ? ' is-in' : ''}`} aria-labelledby="clef-section-title">
      <div className="public-wrap">
        <div className="lx-heading lx-heading--center lx-heading--light lx-clef-head">
          <p className="lx-eyebrow">La méthode MCE</p>
          <h2 id="clef-section-title">Quatre repères pour <span>mieux manager</span></h2>
          <p>La méthode C.L.E.F. : donner un cap, écouter, poser un cadre juste et développer l’autonomie.</p>
          <div className="lx-clef-word" aria-hidden="true">
            <KeyRound size={17} />
            {CLEF_PRINCIPLES.map(({ letter }, index) => (
              <span key={letter}>{index > 0 && <i />}<b className={index <= active ? 'is-on' : undefined}>{letter}</b></span>
            ))}
          </div>
        </div>

        <div className="lx-clef-rail" aria-hidden="true">
          <div className="lx-clef-rail-line"><span style={{ width: `${progress}%` }} /></div>
          <div className="lx-clef-rail-nodes">{CLEF_PRINCIPLES.map(({ letter }, index) => <i key={letter} className={index <= active ? 'is-on' : undefined} />)}</div>
        </div>

        <ol className="lx-clef" onMouseLeave={() => setPaused(false)}>
          {CLEF_PRINCIPLES.map(({ letter, title, action, summary }, index) => {
            const Icon = ICONS[letter];
            return (
              <li key={letter} className={index === active ? 'is-on' : undefined} style={{ '--delay': `${index * 80}ms` }}
                onMouseEnter={() => focusCard(index)} onFocus={() => focusCard(index)} onBlur={() => setPaused(false)}>
                <span className="lx-clef-letter" aria-hidden="true">{letter}</span>
                <div className="lx-clef-top">
                  <span className="lx-clef-icon"><Icon size={24} aria-hidden="true" /></span>
                  <span className="lx-clef-step">Étape {String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3>{title}</h3>
                <span className="lx-clef-tag">{action}</span>
                <p>{summary}</p>
                <button type="button" className="lx-clef-more" aria-haspopup="dialog" onClick={() => setDetails(letter)}>
                  En savoir plus<span className="sr-only"> sur « {title} »</span><ArrowRight size={15} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="lx-clef-footer">
          <button type="button" className="public-button public-button-light" aria-haspopup="dialog" onClick={() => setDetails('all')}>
            Découvrir toute la méthode C.L.E.F.<ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      {details && <ClefDetails focusLetter={details === 'all' ? null : details} onClose={() => setDetails(null)} />}
    </section>
  );
}
