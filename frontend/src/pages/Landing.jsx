import { Link } from 'react-router-dom';
import {
  Building2, GraduationCap, BarChart3, ClipboardCheck, PlayCircle, ShieldCheck, ArrowRight,
  Mic, Users, MessagesSquare, Presentation, Sparkles, CheckCircle2, Clock, Star,
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import { ProgressBar } from '../components/ui';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { BRAND } from '../config';

const FEATURES = [
  { icon: Building2, title: 'Un espace par entreprise', text: 'Chaque client dispose de son propre espace : cours, modules, apprenants et résultats, totalement cloisonnés.' },
  { icon: GraduationCap, title: 'Parcours structurés', text: 'Cours, modules et leçons : textes, vidéos, documents, quiz et exercices pratiques.' },
  { icon: BarChart3, title: 'Progression visible', text: 'Barres de progression, temps passé, notes et certificats : chacun voit ses progrès.' },
  { icon: ClipboardCheck, title: 'Évaluation & feedback', text: 'Quiz corrigés automatiquement, exercices notés sur 20 avec retour personnalisé du formateur.' },
  { icon: Clock, title: 'Suivi du temps', text: 'Le formateur observe le temps de connexion et l’assiduité de chaque apprenant.' },
  { icon: ShieldCheck, title: 'Rôles & sécurité', text: 'Apprenant, formateur, administrateur : chacun accède uniquement à ce qui le concerne.' },
];

const MODULES = [
  { icon: Mic, title: 'Prise de parole', text: 'Trouver sa voix, structurer son message' },
  { icon: Users, title: 'Leadership et management', text: 'Clarifier, écouter, décider, faire progresser' },
  { icon: MessagesSquare, title: 'Communication interpersonnelle', text: 'Écouter, reformuler, coopérer' },
  { icon: Presentation, title: 'Animation de réunions', text: 'Influencer, décider et faire avancer' },
  { icon: Sparkles, title: 'Hygiène et propreté', text: 'Santé, présentation et habitudes professionnelles' },
];

const CLEF = [
  { l: 'C', t: 'Clarté', d: 'Un résultat, une priorité, un délai' },
  { l: 'L', t: 'Lucidité & écoute', d: 'Des faits, des questions, un dialogue' },
  { l: 'E', t: 'Équité & équilibre', d: 'Un cadre juste, une posture stable' },
  { l: 'F', t: 'Faire grandir', d: 'Du soutien, des responsabilités, des progrès' },
];

export default function Landing() {
  const { session, profile } = useAuth();
  const spaceLink = session && profile ? homePathForRole(profile.role) : '/login';

  return (
    <div className="bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-navy-700 md:flex">
            <a href="#plateforme" className="hover:text-brand-600">La plateforme</a>
            <a href="#programmes" className="hover:text-brand-600">Programmes</a>
            <a href="#methode" className="hover:text-brand-600">Méthode C.L.E.F.</a>
            <a href="#contact" className="hover:text-brand-600">Contact</a>
          </nav>
          <Link to={spaceLink} className="btn-primary">
            {session ? 'Mon espace' : 'Se connecter'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #2B9FDC 0, transparent 40%), radial-gradient(circle at 80% 60%, #186898 0, transparent 45%)' }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 ring-1 ring-white/15">
              <Star className="h-3.5 w-3.5 text-gold-400" /> Formation professionnelle pour les entreprises
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Des compétences qui s’apprennent.<br />
              <span className="text-brand-400">Des progrès qui se voient.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-200">
              MCE Academy accompagne vos équipes avant, pendant et après la formation : cours en ligne, exercices, quiz,
              suivi de progression et coaching — dans un espace dédié à votre entreprise.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={spaceLink} className="btn-brand px-6 py-3 text-base">
                Accéder à mon espace <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#contact" className="btn px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/10">
                Demander une démo
              </a>
            </div>
            <p className="mt-8 text-sm font-medium tracking-wide text-navy-300">{BRAND.motto}</p>
          </div>

          {/* Aperçu de l'interface */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-3xl bg-gold-500/20 blur-2xl" />
            <div className="card relative rotate-1 p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Programme professionnel</p>
                  <p className="mt-1 font-display text-xl font-bold text-navy-900">VIGILUS IMPACT</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">68 % terminé</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ['Communication interpersonnelle', 100],
                  ['Leadership et management', 80],
                  ['Hygiène de vie et propreté', 60],
                  ['Prise de parole en public', 35],
                  ['Animation de réunions', 10],
                ].map(([t, v]) => (
                  <div key={t}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-navy-800">{t}</span>
                      <span className="text-slate-400">{v}%</span>
                    </div>
                    <ProgressBar value={v} size="sm" />
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
                <div><p className="text-xl font-bold text-navy-900">12 h</p><p className="text-xs text-slate-500">de formation</p></div>
                <div><p className="text-xl font-bold text-navy-900">16/20</p><p className="text-xs text-slate-500">moyenne</p></div>
                <div><p className="text-xl font-bold text-gold-500">3</p><p className="text-xs text-slate-500">badges</p></div>
              </div>
            </div>
            <div className="card absolute -bottom-8 -left-8 flex items-center gap-3 p-4 shadow-lift">
              <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><PlayCircle className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-bold text-navy-900">Miroir vocal</p>
                <p className="text-xs text-slate-500">Leçon suivante · 8 min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATEFORME */}
      <section id="plateforme" className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">La plateforme</p>
          <h2 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">Simple pour l’apprenant. Complète pour le formateur.</h2>
          <p className="mt-4 text-slate-500">Tout ce qu’il faut pour former, suivre et faire progresser vos équipes.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card group p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <div className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROGRAMMES */}
      <section id="programmes" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="eyebrow">Notre progression</p>
              <h2 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">Cinq modules pour faire la différence</h2>
              <p className="mt-4 text-slate-500">
                Notre fil conducteur : <strong className="text-navy-800">comprendre, pratiquer, observer, améliorer</strong>.
                Des apports courts, des situations vécues et des cas métiers inspirés de vos réalités.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-navy-700">
                {['Mises en situation et jeux de rôle', 'Passages filmés avant / après', 'Défis J+7 · J+14 · J+21 · J+30'].map((t) => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-brand-500" /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 lg:col-span-3">
              {MODULES.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="card flex items-center gap-5 p-5 transition hover:shadow-lift">
                  <span className="font-display text-2xl font-extrabold text-brand-200">0{i + 1}</span>
                  <div className="rounded-xl bg-navy-800 p-2.5 text-white"><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-navy-900">{title}</p>
                    <p className="text-sm text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* METHODE CLEF */}
      <section id="methode" className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Méthode MCE</p>
          <h2 className="mt-3 text-3xl font-bold text-navy-900 sm:text-4xl">C.L.E.F. : les 4 gestes du manager</h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CLEF.map(({ l, t, d }) => (
            <div key={l} className="card relative overflow-hidden p-6">
              <span className="absolute -right-3 -top-6 font-display text-[110px] font-extrabold leading-none text-brand-50">{l}</span>
              <div className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 font-display text-xl font-extrabold text-white">{l}</span>
                <h3 className="mt-5 text-lg font-bold text-navy-900">{t}</h3>
                <p className="mt-1 text-sm text-slate-500">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="px-4 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-navy-900 px-8 py-14 text-center sm:px-16">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #2B9FDC 0, transparent 55%)' }} />
          <div className="relative">
            <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-gold-500" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Créez l’espace formation de votre entreprise</h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-200">
              Nous configurons votre espace, vos parcours et vos comptes apprenants. Vous suivez les progrès en temps réel.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`mailto:${BRAND.contactEmail}?subject=Demande de démo MCE Academy`} className="btn-brand px-6 py-3 text-base">
                Nous contacter
              </a>
              <Link to="/login" className="btn px-6 py-3 text-base text-white ring-1 ring-white/25 hover:bg-white/10">Se connecter</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-8">
          <Logo />
          <p>© {new Date().getFullYear()} {BRAND.company} · {BRAND.baseline}</p>
        </div>
      </footer>
    </div>
  );
}
