import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Menu, X } from 'lucide-react';
import Logo from '../components/layout/Logo';
import FormationDetails from '../components/FormationDetails';
import ClefSection from '../components/ClefSection';
import { ContactDetails, SocialLinks } from '../components/PublicContact';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { BRAND } from '../config';
import { HIGHLIGHTS, PILLARS, FORMATIONS, FORMATS, STEPS, PARTNERS, SPACES, AUDIENCES, STATS, VALUES, COUNTRIES } from '../data/publicContent';

const NAVIGATION = [
  ['#formations', 'Formations'], ['#methode', 'Notre approche'], ['#clef', 'C.L.E.F.'],
  ['#partenaires', 'Partenaires'], ['#contact', 'Contact'],
];

export default function Landing() {
  const { session, profile } = useAuth();
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef(null);
  const connected = Boolean(session && profile);
  const spaceLink = connected ? homePathForRole(profile.role) : '/login';
  const enquiry = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent('Une formation avec MCE Academy')}`;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="public-site">
      <a className="public-skip" href="#contenu">Aller au contenu</a>
      <header className="public-header">
        <div className="public-wrap public-header-inner">
          <Logo className="public-logo" />
          <button ref={menuToggle} type="button" className="public-menu-toggle" aria-expanded={menuOpen} aria-controls="public-navigation"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav id="public-navigation" aria-label="Navigation principale" className={`public-navigation ${menuOpen ? 'is-open' : ''}`}>
            {NAVIGATION.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <div className="public-mobile-account">
              <Link to={spaceLink}>{connected ? 'Mon espace' : 'Se connecter'}</Link>
              {!connected && <Link to="/inscription" className="public-button">Créer mon compte</Link>}
            </div>
          </nav>
          <div className="public-account">
            <Link to={spaceLink}>{connected ? 'Mon espace' : 'Se connecter'}</Link>
            {!connected && <Link to="/inscription" className="public-button public-button-small">Créer mon compte</Link>}
          </div>
        </div>
      </header>

      <main id="contenu">
        <section id="top" className="public-wrap public-hero">
          <div className="public-hero-copy">
            <p className="public-eyebrow">MCE Academy · Formation professionnelle</p>
            <h1>Apprendre.<br /><em>Pour agir.</em></h1>
            <p className="public-hero-lead">Des compétences qui s’apprennent.<br />Des progrès qui se voient.</p>
            <p className="public-hero-description">Des formations ancrées dans votre quotidien. On échange, on pratique, on progresse. Puis on continue, ensemble, sur votre espace de formation.</p>
            <div className="public-hero-actions">
              <a href="#formations" className="public-button">Découvrir les formations</a>
              <Link to={connected ? spaceLink : '/inscription'} className="public-text-link">{connected ? 'Retrouver mon espace' : 'Créer mon compte apprenant'}</Link>
            </div>
            <p className="public-hero-location">France · Sénégal · Maroc</p>
          </div>
          <figure className="public-hero-image">
            <img src="/formation-mce.jpg" alt="Une formatrice MCE accompagne un groupe de participants autour d’une table de travail" width="1200" height="1600" fetchPriority="high" />
            <figcaption><span>L’expérience MCE</span><span>Apprendre ensemble, en situation.</span></figcaption>
          </figure>
        </section>

        <div className="public-wrap public-highlights">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => <div key={title}><Icon size={22} strokeWidth={1.5} aria-hidden="true" /><div><h2>{title}</h2><p>{text}</p></div></div>)}
        </div>

        <section id="formations" className="public-wrap public-section">
          <div className="public-section-heading">
            <p className="public-eyebrow">Le catalogue MCE</p>
            <div><h2 className="public-display">Nos formations</h2><p>Huit domaines pour développer les compétences qui font la différence dans votre métier. Découvrez les thèmes, puis le détail de chaque parcours.</p></div>
          </div>
          <div className="public-catalogue">
            {FORMATIONS.map((formation) => {
              const Icon = formation.icon;
              return (
                <article key={formation.title} className="public-formation">
                  <div className="public-formation-heading">
                    <span className="public-card-icon"><Icon size={24} strokeWidth={1.6} aria-hidden="true" /></span>
                    <h3>{formation.title}</h3>
                  </div>
                  <p>{formation.text}</p>
                  <ul aria-label="Thèmes de la formation">{formation.topics.map((topic) => <li key={topic}><Check size={16} aria-hidden="true" />{topic}</li>)}</ul>
                  <div className="public-formation-footer"><button type="button" className="public-card-link" aria-haspopup="dialog" onClick={() => setSelectedFormation(formation)}>En savoir plus<span className="sr-only"> sur {formation.title}</span></button></div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="methode" className="public-wrap public-section">
          <div className="public-approach">
            <div><p className="public-eyebrow">Notre approche pédagogique</p><h2 className="public-display">Apprendre en pratiquant.</h2><p className="public-body-copy">Former pour agir, pas seulement pour savoir. Nous partons de vos enjeux et de vos situations pour construire une formation utile.</p>
              <div className="public-principles">{PILLARS.map(({ title, text }) => <details key={title}><summary>{title}</summary><p>{text}</p></details>)}</div>
            </div>
            <div className="public-method-steps">{STEPS.map(({ icon: Icon, title, text }) => <div key={title}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
          </div>
          <div className="public-formats"><h3>Des formats adaptés à votre équipe</h3><div>{FORMATS.map(({ title, text, icon: Icon }) => <article key={title}><Icon size={24} strokeWidth={1.6} aria-hidden="true" /><h4>{title}</h4><p>{text}</p></article>)}</div></div>
        </section>

        <ClefSection />

        <section id="plateforme" className="public-wrap public-section">
          <div className="public-section-heading"><p className="public-eyebrow">La plateforme MCE Academy</p><div><h2 className="public-display">Votre espace de formation</h2><p>Trois espaces complémentaires pour apprendre, suivre les progrès et accompagner chaque parcours.</p></div></div>
          <div className="public-spaces">{SPACES.map(({ icon: Icon, role, items }) => <article key={role}><Icon size={26} strokeWidth={1.4} aria-hidden="true" /><h3>{role}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        </section>

        <section id="mce" className="public-about">
          <div className="public-wrap public-section">
            <div className="public-section-heading"><p className="public-eyebrow">Qui sommes-nous ?</p><div><h2 className="public-display">Le groupe MCE</h2><p>Entreprises, institutions, écoles, entrepreneurs et jeunes talents : nous créons des passerelles entre les compétences et les projets.</p></div></div>
            <h3 className="public-group-title">MCE en chiffres</h3>
            <div className="public-stats">{STATS.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
            <h3 className="public-group-title">Notre engagement</h3>
            <div className="public-values">{VALUES.map(([title, Icon, text]) => <article key={title}><Icon size={23} strokeWidth={1.6} aria-hidden="true" /><h4>{title}</h4><p>{text}</p></article>)}</div>
            <h3 className="public-group-title">Nos implantations</h3>
            <div className="public-countries">{COUNTRIES.map(({ c, r, items }) => <article key={c}><h4>{c}</h4><p>{r}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
            <div className="public-audiences"><h3>Des parcours pour vous.</h3><ul>{AUDIENCES.map(({ t }) => <li key={t}>{t}</li>)}</ul></div>
            <h3 className="public-group-title">Paroles d’expérience</h3>
            <div className="public-quotes">
              <figure><blockquote>« Notre rôle est de révéler les potentiels, de créer des passerelles et de transformer les ambitions en leviers de performance et d’impact. »</blockquote><figcaption><strong>Mounia Amane</strong><span>Fondatrice & Directrice générale, MCE Group</span></figcaption></figure>
              <figure><blockquote>« Les services MCE sont irréprochables, réactifs et répondent aux besoins des clients. Foncez, vous ne serez pas déçu ! »</blockquote><figcaption><strong>Aurélie Goubier</strong><span>Avis client · juillet 2025</span></figcaption></figure>
            </div>
          </div>
        </section>

        <section id="partenaires" className="public-partners">
          <div className="public-wrap public-section">
            <div className="public-section-heading"><p className="public-eyebrow">Ils nous font confiance</p><div><h2 className="public-display">Nos partenaires accompagnés</h2><p>Des équipes qui ont bénéficié de l’accompagnement de MCE.</p></div></div>
            {PARTNERS.map(({ name, logo, text, themes }) => (
              <article key={name} className="public-partner">
                <div className="public-partner-logo"><img src={logo} alt={`Logo ${name}`} width="180" height="160" loading="lazy" /></div>
                <div><p className="public-partner-label">Partenaire accompagné</p><h3>{name}</h3><p>{text}</p><ul aria-label="Axes de l’accompagnement">{themes.map((theme) => <li key={theme}>{theme}</li>)}</ul></div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="public-contact-callout">
          <div className="public-wrap"><div><p className="public-eyebrow">La prochaine étape</p><h2 className="public-display">Construisons votre<br /><em>prochain parcours.</em></h2><p>Vous êtes une organisation ? Parlons de votre besoin.<br />Vous êtes apprenant ? Votre parcours commence ici.</p></div><div className="public-contact-actions"><a href={enquiry} className="public-button public-button-light">Parlons de votre formation</a><Link to={connected ? spaceLink : '/inscription'} className="public-light-link">{connected ? 'Accéder à mon espace' : 'Créer mon compte apprenant'}</Link>{!connected && <Link to="/login" className="public-light-link">J’ai déjà un compte</Link>}<p>Un code d’entreprise vous sera demandé à l’inscription.</p></div></div>
        </section>
      </main>

      <footer className="public-footer public-wrap">
        <div className="public-footer-main"><div><Logo /><p>{BRAND.motto}</p><SocialLinks /></div><div><h2>Explorer MCE Academy</h2><ul>{NAVIGATION.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}<li><a href="#plateforme">La plateforme</a></li></ul></div><div><h2>Restons en contact</h2><ContactDetails /></div></div>
        <div className="public-footer-bottom"><span>© {new Date().getFullYear()} {BRAND.company}</span><span>{BRAND.baseline}</span></div>
      </footer>
      {selectedFormation && <FormationDetails formation={selectedFormation} formats={FORMATS} onClose={() => setSelectedFormation(null)} />}
    </div>
  );
}
