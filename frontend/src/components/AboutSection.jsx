import { useState } from 'react';
import { ArrowRight, BarChart3, Compass, Eye, Gem, GraduationCap, MonitorSmartphone, Quote, Sparkles, Target, Users } from 'lucide-react';
import Flag from './Flag';
import CountUp from './CountUp';
import useInView from './useInView';

// Contenus repris de la page « Découvrir MCE » de mceafrika.com/mce-partenaires.
const TABS = [
  { id: 'vision', label: 'Vision', icon: Eye, title: 'Notre vision', text: 'Devenir le connecteur de référence entre l’Europe, le Maroc et l’Afrique de l’Ouest pour les talents et la transformation des organisations.' },
  { id: 'mission', label: 'Mission', icon: Target, title: 'Notre mission', text: 'Apporter des solutions concrètes aux entreprises, institutions, ONG, écoles, universités et entrepreneurs pour structurer, former, recruter, digitaliser et accélérer leur croissance.' },
  { id: 'valeurs', label: 'Valeurs', icon: Gem, title: 'Nos valeurs', values: ['Excellence', 'Transmission', 'Proximité', 'Innovation', 'Inclusion', 'Impact mesurable'] },
];

const POLES = [
  [GraduationCap, 'Formation & MCE Academy'],
  [Users, 'Talents & RH'],
  [Compass, 'Accompagnement stratégique'],
  [MonitorSmartphone, 'Solutions digitales'],
  [Sparkles, 'Événements & impact'],
];

const COUNTRIES = [['France', 'Siège & direction'], ['Sénégal', 'Hub Afrique de l’Ouest'], ['Maroc', 'Développement régional']];

export default function AboutSection() {
  const [tab, setTab] = useState('vision');
  const [ref, visible] = useInView(0.25);
  const current = TABS.find((item) => item.id === tab);

  return (
    <section id="mce" ref={ref} className={`lx-section lx-about-section${visible ? ' is-in' : ''}`} aria-labelledby="mce-title">
      <div className="public-wrap lx-about">
        <div className="lx-collage">
          <span className="lx-collage-dots" aria-hidden="true" />
          <img className="lx-collage-main" src="/mce-afterwork.jpg" alt="Rencontre professionnelle organisée par MCE" width="960" height="1280" loading="lazy" />
          <img className="lx-collage-second" src="/mce-stayup.jpg" alt="Mounia Amane, fondatrice de MCE, au salon Stay Up" width="1050" height="1400" loading="lazy" />
          <div className="lx-collage-badge"><strong><CountUp value="+20 ans" start={visible} /></strong><span>d’expérience en management et leadership</span></div>
          <ul className="lx-collage-countries" aria-label="Implantations MCE">
            {COUNTRIES.map(([country, role]) => (
              <li key={country}><Flag country={country} /><div><strong>{country}</strong><small>{role}</small></div></li>
            ))}
          </ul>
        </div>

        <div className="lx-about-content">
          <p className="lx-eyebrow">Qui sommes-nous ?</p>
          <h2 id="mce-title" className="lx-about-title">Des passerelles entre <span>les talents et les projets</span></h2>
          <p className="lx-text">Après plus de 20 ans entre management, développement commercial, recrutement et leadership en France et au Maroc, Mounia Amane a créé MCE avec une conviction : les organisations grandissent mieux lorsqu’elles investissent dans l’humain, la structuration et l’innovation.</p>

          <div className="lx-about-tabs">
            <div role="tablist" aria-label="Vision, mission et valeurs de MCE" className="lx-tablist">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls="about-panel" className={tab === id ? 'is-active' : undefined} onClick={() => setTab(id)}>
                  <Icon size={16} aria-hidden="true" />{label}
                </button>
              ))}
            </div>
            <div key={tab} id="about-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="lx-tabpanel">
              <h3>{current.title}</h3>
              {current.values
                ? <ul className="lx-value-chips">{current.values.map((value) => <li key={value}>{value}</li>)}</ul>
                : <p>{current.text}</p>}
            </div>
          </div>

          <div className="lx-poles">
            <p className="lx-poles-title"><BarChart3 size={15} aria-hidden="true" />5 pôles d’expertise</p>
            <ul>{POLES.map(([Icon, label]) => <li key={label}><Icon size={15} aria-hidden="true" />{label}</li>)}</ul>
          </div>

          <figure className="lx-founder">
            <Quote size={22} aria-hidden="true" />
            <blockquote>MCE ne propose pas des solutions génériques : elle crée des parcours concrets et sur mesure.</blockquote>
            <figcaption>
              <span className="lx-founder-avatar" aria-hidden="true">MA</span>
              <div><strong>Mounia Amane</strong><small>Fondatrice & Directrice générale, MCE Group</small></div>
              <a href="#formations" className="public-button public-button-small">Nos formations<ArrowRight size={16} aria-hidden="true" /></a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
