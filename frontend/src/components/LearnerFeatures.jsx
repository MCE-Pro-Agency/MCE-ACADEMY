import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Download, Lock, Play, TrendingUp } from 'lucide-react';
import { HIGHLIGHTS } from '../data/publicContent';

// Aperçus illustratifs de l'espace apprenant (pas des données réelles).
function ProfileViz() {
  return (
    <div className="lx-viz lx-viz-profile">
      <div className="lx-ring" style={{ '--p': 72 }}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle className="lx-ring-val" cx="60" cy="60" r="52" /></svg>
        <div><strong>20</strong><span>min</span></div>
      </div>
      <ul className="lx-tags">
        <li className="is-good"><Check size={14} aria-hidden="true" />Clarté du message</li>
        <li className="is-good"><Check size={14} aria-hidden="true" />Écoute active</li>
        <li className="is-work"><ArrowUp size={14} aria-hidden="true" />Gestion du stress</li>
      </ul>
    </div>
  );
}

const MODULES = [
  ['is-done', 'Les fondamentaux', '100%'],
  ['is-done', 'La voix et le corps', '100%'],
  ['is-current', 'Structurer son discours', '60%'],
  ['is-locked', 'Mise en situation', '0%'],
];
function ModulesViz() {
  return (
    <ol className="lx-viz lx-modules">
      {MODULES.map(([state, label, width], i) => (
        <li key={label} className={state}>
          <i aria-hidden="true">{state === 'is-done' ? <Check size={13} /> : state === 'is-current' ? <Play size={11} fill="currentColor" /> : <Lock size={12} />}</i>
          <span>Module {i + 1} · {label}</span>
          <b style={{ '--w': width }} aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

function TrackViz() {
  const line = 'M0 92 C40 88 60 70 95 72 S150 52 185 55 S240 30 270 26 S305 14 320 10';
  return (
    <div className="lx-viz lx-track">
      <div className="lx-chart">
        <span className="lx-chart-badge"><TrendingUp size={13} aria-hidden="true" />En progrès</span>
        <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="lxArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1C6FB8" stopOpacity=".28" /><stop offset="1" stopColor="#1C6FB8" stopOpacity="0" /></linearGradient></defs>
          <path className="lx-chart-area" d={`${line} V110 H0Z`} fill="url(#lxArea)" />
          <path className="lx-chart-line" d={line} />
          <circle className="lx-chart-dot" cx="320" cy="10" r="5" />
        </svg>
        <div className="lx-chart-axis" aria-hidden="true"><span>S1</span><span>S2</span><span>S3</span><span>S4</span><span>S5</span></div>
      </div>
      <div className="lx-msg">
        <span className="lx-msg-avatar" aria-hidden="true">F</span>
        <div><strong>Votre formateur</strong><p>Belle progression sur la posture. Prochain objectif : le rythme.</p></div>
      </div>
    </div>
  );
}

const FILES = [
  ['pdf', 'PDF', 'Mémo essentiel', 'À télécharger', Download],
  ['doc', 'FICHE', 'Exercices pratiques', 'À télécharger', Download],
  ['vid', 'VIDÉO', 'Replay de la session', 'À revoir', Play],
];
function FilesViz() {
  return (
    <ul className="lx-viz lx-files">
      {FILES.map(([kind, badge, title, meta, Icon]) => (
        <li key={title}>
          <span className={`lx-file lx-file--${kind}`} aria-hidden="true">{badge}</span>
          <div><strong>{title}</strong><small>{meta}</small></div>
          <span className="lx-file-action" aria-hidden="true"><Icon size={16} /></span>
        </li>
      ))}
    </ul>
  );
}

const VISUALS = [ProfileViz, ModulesViz, TrackViz, FilesViz];

export default function LearnerFeatures() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return setInView(true);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lx-features-block">
      <div className="lx-heading">
        <p className="lx-eyebrow">Votre espace en ligne</p>
        <h2>La formation continue <span>après la session</span></h2>
      </div>
      <ul ref={ref} className={`lx-features${inView ? ' is-in' : ''}`}>
        {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => {
          const Visual = VISUALS[i];
          return (
            <li key={title} className={i === 1 ? 'is-feature' : undefined} style={{ '--delay': `${i * 100}ms` }}>
              <span className="lx-feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="lx-icon"><Icon size={18} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              {Visual && <Visual />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
