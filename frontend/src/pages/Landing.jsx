import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, Award, Check, ChevronLeft, ChevronRight, Facebook, Globe2, HeartHandshake, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Minus, Phone, Plus, Quote, Target, UserRound, Users, X, Youtube } from 'lucide-react';
import Logo from '../components/layout/Logo';
import FormationDetails from '../components/FormationDetails';
import Flag from '../components/Flag';
import ClefSection from '../components/ClefSection';
import AboutSection from '../components/AboutSection';
import CountUp from '../components/CountUp';
import useInView from '../components/useInView';
import LearnerFeatures from '../components/LearnerFeatures';
import PublicLearnerAccess from '../components/PublicLearnerAccess';
import { ContactDetails, SocialLinks } from '../components/PublicContact';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { BRAND } from '../config';
import { FORMATIONS, FORMATS, STEPS, PARTNERS, AUDIENCES, STATS, VALUES, COUNTRIES } from '../data/publicContent';
import { FORMATION_VISUALS } from '../data/publicVisuals';

const NAVIGATION = [
  ['#formations', 'Formations'], ['#mce', 'Qui sommes-nous'], ['#methode', 'Méthode'],
  ['#clef', 'C.L.E.F.'], ['#partenaires', 'Partenaires'], ['#contact', 'Contact'],
];

const FAQ = [
  { question: 'Comment rejoindre mon espace apprenant ?', answer: 'Votre entreprise ou votre formateur vous transmet un code. Indiquez-le lors de la création de votre compte, puis connectez-vous pour commencer votre parcours.' },
  { question: 'À quoi sert le test de profil professionnel ?', answer: 'Il vous aide à identifier vos points d’appui et vos axes de progression. Vos résultats vous permettent, avec votre formateur, de mieux cibler votre travail pendant la formation.' },
  { question: 'Quand les modules deviennent-ils accessibles ?', answer: 'Votre formateur ouvre les modules au fil de la formation. Retrouvez dans votre espace les contenus, les exercices et les supports mis à votre disposition.' },
  { question: 'Peut-on adapter une formation à notre entreprise ?', answer: 'Oui. MCE part de vos objectifs, de vos métiers et des situations rencontrées par vos équipes pour adapter les thèmes, les exercices et le format de l’accompagnement.' },
  { question: 'Comment se poursuit le travail après la formation ?', answer: 'La plateforme permet de retrouver ses ressources, de mettre en pratique ses engagements et d’échanger avec son formateur. La méthode C.L.E.F. propose des étapes de progression jusqu’à J+30.' },
];

// Mot de la fondatrice, puis avis Google publiés sur mceafrika.com (textes d'origine).
const TESTIMONIALS = [
  { founder: true, quote: 'Notre rôle est de révéler les potentiels, de créer des passerelles et de transformer les ambitions en leviers de performance et d’impact.', name: 'Mounia Amane', role: 'Fondatrice & Directrice générale, MCE Group' },
  { quote: 'Mounia est dynamique, ambitieuse, sérieuse et consciencieuse. Elle a une empathie extraordinaire, donne toujours de sa personne pour satisfaire les autres et son énergie boost toute une troupe ! Les services MCE sont irréprochables, réactifs et répondent aux besoins des clients. Foncez vous ne serez pas déçu !', name: 'Aurelie Goubier', role: 'Avis Google · juillet 2025', url: 'https://www.google.com/maps/contrib/104142318056676824561/reviews?hl=fr' },
  { quote: 'J’ai eu l’occasion de collaborer avec MCE et j’en suis pleinement satisfaite. Le résultat était au-delà de mes attentes. Les conseils donnés par Mounia et son travail sont au top. Je ne peux que recommander MCE. Bienveillance, écoute, réactivité et conseils sont les qualités que j’ai pu voir en faisant appel à MCE.', name: 'Sakina', role: 'Avis Google · mai 2024' },
  { quote: 'Mounia est une conseillère en communication, très humaine, professionnelle, elle saura vous orienter vers l’outil le mieux adapté, afin de faire évoluer votre société, comme elle a sût si bien faire avec la mienne, je ne la remercierais jamais assez d’avoir eu les bons mots au bon moment. Vous pouvez lui faire confiance les yeux fermés.', name: 'Aurélie Robin', role: 'Avis Google · octobre 2024' },
  { quote: 'Je ne peux que recommander les services de cette entreprise. L’équipe est extrêmement professionnelle, réactive et à l’écoute des besoins de ses clients. Leurs attentions aux détails et leur capacité à anticiper les imprévus ont été impressionnantes. Chaque étape du processus a été gérée avec soin, ce qui a rendu la collaboration agréable et sans stress.', name: 'Lili Lili', role: 'Avis Google · octobre 2024' },
  { quote: 'Quelle bonheur de travailler avec MCE ! Equipe dynamique, efficace et professionnelle. Votre business se transformera et votre marge croîtra. Je recommande vivement !', name: 'B Moubarik', role: 'Avis Google · juin 2024' },
];
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const STEP_PHOTOS = ['/mce-reunion.jpg', '/mce-collaboration.jpg', '/mce-prise-parole.jpg', '/mce-partage.jpg'];
const FORMAT_PHOTOS = ['/mce-interview.jpeg', '/mce-auditoire.jpeg', '/mce-remise-prix.jpeg', '/mce-entrepreneurs.jpg'];
const COUNTRY_PHOTOS = { Sénégal: '/mce-rencontres.jpeg', France: '/mce-reunion.jpg', Maroc: '/mce-maroc.jpg' };
const MCE_LINKS = [
  [BRAND.website, 'Le site MCE Afrika'], [BRAND.academyUrl, 'MCE Academy'], [BRAND.trainingsUrl, 'Nos formations'],
  [BRAND.galleryUrl, 'Galerie'], [BRAND.contactUrl, 'Page contact'], [BRAND.privacyUrl, 'Confidentialité'],
];
const SOCIAL_ICONS = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };
const STAT_ICONS = [Globe2, Users, HeartHandshake, Award];
const ABOUT_ICONS = [Globe2, Target];

function Heading({ eyebrow, title, accent, text, center = false, light = false, id }) {
  return (
    <div className={`lx-heading${center ? ' lx-heading--center' : ''}${light ? ' lx-heading--light' : ''}`}>
      <p className="lx-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title} <span>{accent}</span></h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function StatsBand() {
  const [ref, visible] = useInView(0.3);
  return (
    <section className="lx-stats-band" aria-label="MCE en chiffres">
      <div className="public-wrap">
        <ul ref={ref} className={`lx-stats${visible ? ' is-in' : ''}`}>
          {STATS.map(([value, label], index) => {
            const Icon = STAT_ICONS[index];
            const [, plus = '', number = value, unit = ''] = String(value).match(/^(\+?)(\d+)\s*(.*)$/) || [];
            return (
              <li key={label}>
                <span className="lx-stats-icon"><Icon size={24} aria-hidden="true" /></span>
                <div>
                  <strong>
                    <span aria-hidden="true">{plus && <i>+</i>}<CountUp value={number} start={visible} />{unit && <small>{unit}</small>}</span>
                    <span className="sr-only">{value}</span>
                  </strong>
                  <p>{label}</p>
                  {index === 0 && <div className="lx-stats-chips">{['France', 'Sénégal', 'Maroc'].map((country) => <span key={country}>{country}</span>)}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function Landing() {
  const { session, profile } = useAuth();
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const menuToggle = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // En-tête compact au défilement et lien du menu actif selon la section affichée.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      NAVIGATION.forEach(([href]) => { const node = document.querySelector(href); if (node) observer.observe(node); });
    }
    return () => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); };
  }, []);
  const connected = Boolean(session && profile);
  const spaceLink = connected ? homePathForRole(profile.role) : '/login';
  const enquiry = BRAND.contactUrl;
  const external = { target: '_blank', rel: 'noopener noreferrer' };
  const partner = PARTNERS[0];
  const testimonial = TESTIMONIALS[quoteIndex];
  const [mainCountry, ...otherCountries] = [COUNTRIES[1], COUNTRIES[0], COUNTRIES[2]];

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

  const changeQuote = (step) => setQuoteIndex((quoteIndex + step + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div className="public-site">
      <a className="public-skip" href="#contenu">Aller au contenu</a>
      <header className={`public-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="public-topbar"><div className="public-wrap">
          <ul className="public-topbar-phones" aria-label="Nous appeler">
            {BRAND.phones.map(({ label, number, href }) => (
              <li key={label}><a href={href} aria-label={`${label} : ${number}`}><Flag country={label} /><span>{number}</span></a></li>
            ))}
            <li className="public-topbar-email"><a href={`mailto:${BRAND.contactEmail}`}><Mail size={14} aria-hidden="true" /><span>{BRAND.contactEmail}</span></a></li>
          </ul>
          <div className="public-topbar-right">
            <p className="public-topbar-countries"><span>Présents en</span>{['Sénégal', 'France', 'Maroc'].map((country) => <Flag key={country} country={country} className="public-flag-small" />)}<span className="sr-only">Sénégal, France et Maroc</span></p>
            <ul className="public-topbar-socials" aria-label="Réseaux sociaux MCE">
              {BRAND.socials.map(({ name, href }) => {
                const Icon = SOCIAL_ICONS[name];
                return <li key={name}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} (nouvel onglet)`}><Icon size={14} aria-hidden="true" /></a></li>;
              })}
            </ul>
          </div>
        </div></div>
        <div className="public-wrap public-header-inner">
          <Logo className="public-logo" />
          <button ref={menuToggle} type="button" className="public-menu-toggle" aria-expanded={menuOpen} aria-controls="public-navigation"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav id="public-navigation" aria-label="Navigation principale" className={`public-navigation ${menuOpen ? 'is-open' : ''}`}>
            {NAVIGATION.map(([href, label]) => (
              <a key={href} href={href} className={activeSection === href ? 'is-active' : undefined} aria-current={activeSection === href ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="public-mobile-account">
              <Link to={spaceLink}>{connected ? 'Mon espace' : 'Se connecter'}</Link>
              {!connected && <Link to="/inscription" className="public-button">Créer mon compte</Link>}
            </div>
          </nav>
          <div className="public-account">
            <Link to={spaceLink} className="public-login-link"><UserRound size={17} aria-hidden="true" />{connected ? 'Mon espace' : 'Se connecter'}</Link>
            {!connected && <Link to="/inscription" className="public-button public-button-small">Créer mon compte<ArrowRight size={16} aria-hidden="true" /></Link>}
          </div>
        </div>
      </header>

      <main id="contenu">
        {/* Accueil : photo en fond, texte par-dessus */}
        <section className="lx-hero">
          <div className="public-wrap lx-hero-inner">
            <p className="lx-hero-tag">MCE Academy · Formation professionnelle des entreprises</p>
            <h1>Faire grandir vos équipes. <span>Durablement.</span></h1>
            <p className="lx-hero-text">Des formations concrètes, construites autour de vos métiers, et un espace en ligne pour poursuivre les progrès après chaque session.</p>
            <div className="lx-hero-actions">
              <a href="#formations" className="public-button">Découvrir nos formations<ArrowRight size={17} aria-hidden="true" /></a>
              <div className="lx-proof">
                <div className="lx-avatars" aria-hidden="true">
                  {['/mce-interview.jpeg', '/mce-entrepreneurs.jpg', '/mce-partage.jpg'].map((src) => <img key={src} src={src} alt="" />)}
                </div>
                <div><strong>+50 clients accompagnés</strong><span>France · Sénégal · Maroc</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Atouts + carte d'accès apprenant */}
        <div className="public-wrap lx-intro">
          <LearnerFeatures />
          <PublicLearnerAccess connected={connected} spaceLink={spaceLink} />
        </div>

        {/* Qui sommes-nous */}
        <AboutSection />

        {/* Formations */}
        <section id="formations" className="lx-section lx-section--tint" aria-labelledby="formations-title">
          <div className="public-wrap">
            <div className="lx-heading-row">
              <Heading id="formations-title" eyebrow="Nos formations" title="Des compétences utiles," accent="pour chaque métier" />
              <a href={enquiry} {...external} className="public-button public-button-outline">Demander un programme<ArrowRight size={17} aria-hidden="true" /><span className="sr-only"> (nouvel onglet)</span></a>
            </div>
            <div className="lx-catalogue">
              {FORMATIONS.map((formation) => {
                const visual = FORMATION_VISUALS[formation.title];
                const Icon = formation.icon;
                return (
                  <article key={formation.title} className="lx-service">
                    <img src={visual.src} alt="" width={visual.width} height={visual.height} loading="lazy" style={{ objectPosition: visual.position || 'center' }} />
                    <div className="lx-service-content">
                      <span className="lx-service-icon"><Icon size={20} aria-hidden="true" /></span>
                      <h3>{formation.title}</h3>
                      <p>{formation.summary}</p>
                      <button type="button" aria-haspopup="dialog" onClick={() => setSelectedFormation(formation)}>
                        En savoir plus<span className="sr-only"> sur {formation.title}</span><ArrowRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section id="methode" className="lx-section" aria-labelledby="methode-title">
          <div className="public-wrap">
            <Heading center id="methode-title" eyebrow="Notre méthode de travail" title="Comment nous accompagnons" accent="vos équipes" />
            <ol className="lx-steps">
              {STEPS.map(({ title, text }, index) => (
                <li key={title}>
                  <div className="lx-step-photo"><img src={STEP_PHOTOS[index]} alt="" loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <h3>Étape {index + 1} : {title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <div className="lx-method-band">
              <div className="lx-method-band-photos" aria-hidden="true">
                {['/mce-session-travail.jpg', '/formation-parole.jpg', '/formation-relation-client.jpg'].map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
              </div>
              <div className="lx-method-band-text">
                <p className="lx-method-band-tag">Étape 1, dès aujourd’hui</p>
                <h3>Parlons de vos équipes et de vos objectifs.</h3>
                <p>Un premier échange suffit pour cerner vos besoins et vous proposer le format adapté.</p>
              </div>
              <div className="lx-method-band-actions">
                <a href={enquiry} {...external} className="public-button public-button-light"><Mail size={17} aria-hidden="true" />Demander un diagnostic<span className="sr-only"> (nouvel onglet)</span></a>
                <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="lx-method-band-link"><MessageCircle size={17} aria-hidden="true" />Écrire sur WhatsApp<span className="sr-only"> (nouvel onglet)</span></a>
              </div>
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="lx-section lx-section--tint" aria-labelledby="formats-title">
          <div className="public-wrap">
            <Heading center id="formats-title" eyebrow="Nos formats" title="Une formule adaptée" accent="à votre besoin" />
            <div className="lx-formats">
              {FORMATS.map(({ title, tag, text }, index) => (
                <article key={title}>
                  <img src={FORMAT_PHOTOS[index]} alt="" loading="lazy" />
                  <div><span>{tag}</span><h3>{title}</h3><p>{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="lx-testimonials" aria-labelledby="avis-title">
          <div className="public-wrap lx-testimonials-grid">
            <div className="lx-testimonial-photos">
              <img src="/mce-entrepreneurs.jpg" alt="Participants lors d’une rencontre MCE" loading="lazy" />
              <div><img src="/mce-rencontres.jpeg" alt="" loading="lazy" /><img src="/mce-session-travail.jpg" alt="" loading="lazy" /></div>
            </div>
            <div>
              <Heading light id="avis-title" eyebrow="Ils en parlent" title="Ce que disent" accent="ceux qui nous connaissent" />
              <figure key={quoteIndex} className={`lx-quote${testimonial.founder ? ' is-founder' : ''}`} aria-live="polite">
                <Quote className="lx-quote-mark" size={64} aria-hidden="true" />
                <span className={`lx-quote-badge${testimonial.founder ? ' is-founder' : ''}`}>
                  {testimonial.founder ? <><Award size={14} aria-hidden="true" />Mot de la fondatrice</> : <><Check size={14} aria-hidden="true" />Avis Google vérifié</>}
                </span>
                <blockquote>« {testimonial.quote} »</blockquote>
                <figcaption>
                  {testimonial.photo
                    ? <img className="lx-quote-avatar" src={testimonial.photo} alt="" loading="lazy" />
                    : <span className="lx-quote-avatar" aria-hidden="true">{initials(testimonial.name)}</span>}
                  <div><strong>{testimonial.name}</strong><span>{testimonial.role}</span></div>
                </figcaption>
                {testimonial.url && <a className="lx-quote-source" href={testimonial.url} target="_blank" rel="noopener noreferrer">Voir sur Google<span className="sr-only"> (nouvel onglet)</span></a>}
              </figure>
              <div className="lx-quote-nav">
                <button type="button" onClick={() => changeQuote(-1)} aria-label="Témoignage précédent"><ChevronLeft size={20} /></button>
                <button type="button" onClick={() => changeQuote(1)} aria-label="Témoignage suivant"><ChevronRight size={20} /></button>
                <div className="lx-quote-dots" role="group" aria-label="Choisir un témoignage">
                  {TESTIMONIALS.map((item, index) => (
                    <button key={item.name} type="button" className={index === quoteIndex ? 'is-active' : undefined} aria-label={`Témoignage ${index + 1} : ${item.name}`} aria-current={index === quoteIndex} onClick={() => setQuoteIndex(index)} />
                  ))}
                </div>
                <span className="lx-quote-count"><strong>{String(quoteIndex + 1).padStart(2, '0')}</strong> / {String(TESTIMONIALS.length).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chiffres */}
        <StatsBand />

        <ClefSection />

        {/* Partenaires */}
        <section id="partenaires" className="lx-section lx-section--tint" aria-labelledby="partenaires-title">
          <div className="public-wrap lx-partners">
            <div>
              <Heading id="partenaires-title" eyebrow="Ils nous font confiance" title="Nos partenaires" accent="accompagnés" text="Des organisations qui ont bénéficié de l’accompagnement de MCE pour faire progresser leurs équipes." />
              <p className="lx-audiences">{AUDIENCES.map(({ t }) => <span key={t}>{t}</span>)}</p>
            </div>
            <article className="lx-partner">
              <img src={partner.logo} alt={`Logo ${partner.name}`} width="842" height="751" loading="lazy" />
              <div>
                <p className="lx-eyebrow">Partenaire accompagné</p>
                <h3>{partner.name}</h3>
                <p>{partner.text}</p>
                <ul>{partner.themes.map((theme) => <li key={theme}>{theme}</li>)}</ul>
              </div>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section className="lx-section" aria-labelledby="faq-title">
          <div className="public-wrap lx-faq">
            <div>
              <Heading id="faq-title" eyebrow="Vos questions" title="Questions" accent="fréquentes" />
              <div className="lx-faq-list">
                {FAQ.map(({ question, answer }, index) => (
                  <details key={question} open={index === 0}>
                    <summary>{question}<span aria-hidden="true"><Plus size={16} className="lx-plus" /><Minus size={16} className="lx-minus" /></span></summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="lx-faq-photos">
              <img src="/mce-auditoire.jpeg" alt="Participants lors d’une conférence MCE" loading="lazy" />
              <img src="/mce-collaboration.jpg" alt="Travail en petit groupe" loading="lazy" />
            </div>
          </div>
        </section>

        {/* Implantations */}
        <section className="lx-section lx-section--tint" aria-labelledby="pays-title">
          <div className="public-wrap">
            <Heading center id="pays-title" eyebrow="Nos implantations" title="Présents dans" accent="trois pays" />
            <div className="lx-countries">
              <article className="lx-country lx-country--main">
                <img src={COUNTRY_PHOTOS[mainCountry.c]} alt="" loading="lazy" />
                <div><span className="lx-chip">{mainCountry.r}</span><h3><Flag country={mainCountry.c} />{mainCountry.c}</h3><ul>{mainCountry.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </article>
              <div className="lx-country-side">
                {otherCountries.map(({ c, r, items }) => (
                  <article key={c} className="lx-country">
                    <div className="lx-country-media"><img src={COUNTRY_PHOTOS[c]} alt="" loading="lazy" /></div>
                    <div><span className="lx-chip">{r}</span><h3><Flag country={c} />{c}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Carte */}
        <div className="lx-map">
          <iframe title="MCE à Dakar, Sénégal" src="https://www.google.com/maps?q=Dakar,%20S%C3%A9n%C3%A9gal&z=12&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </main>

      <footer className="public-footer"><div className="public-wrap">
        <div id="contact" className="lx-cta">
          <div><h2>Un projet de formation ? Parlons-en.</h2><p>Présentez-nous vos équipes et vos objectifs : nous construisons avec vous le programme adapté.</p></div>
          <div className="lx-cta-actions">
            <a href={enquiry} {...external} className="public-button public-button-light"><Mail size={17} aria-hidden="true" />Nous écrire<span className="sr-only"> (nouvel onglet)</span></a>
            <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="public-button public-button-ghost"><MessageCircle size={17} aria-hidden="true" />WhatsApp<span className="sr-only"> (nouvel onglet)</span></a>
          </div>
        </div>
        <div className="public-footer-main"><div><Logo dark /><p>{BRAND.motto}</p><SocialLinks /></div><div><h2>Liens utiles</h2><ul>{NAVIGATION.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul></div><div><h2>MCE Afrika</h2><ul>{MCE_LINKS.map(([href, label]) => <li key={href}><a href={href} {...external}>{label}<span className="sr-only"> (nouvel onglet)</span></a></li>)}</ul></div><div><h2>Nos coordonnées</h2><ContactDetails /></div></div>
        <div className="public-footer-bottom">
          <p className="public-footer-copy"><Logo compact className="public-footer-mark" />© {new Date().getFullYear()} MCE Group · Tous droits réservés</p>
          <p className="public-footer-baseline"><span aria-hidden="true" />{BRAND.baseline}<span aria-hidden="true" /></p>
          <div className="public-footer-legal">
            <a href={BRAND.privacyUrl} {...external}>Confidentialité<span className="sr-only"> (nouvel onglet)</span></a>
            <a href={BRAND.termsUrl} {...external}>CGV<span className="sr-only"> (nouvel onglet)</span></a>
            <a href="#contenu" className="public-footer-top" aria-label="Revenir en haut de la page"><ArrowUp size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </div></footer>
      {selectedFormation && <FormationDetails formation={selectedFormation} formats={FORMATS} onClose={() => setSelectedFormation(null)} />}
    </div>
  );
}
