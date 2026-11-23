import { useEffect, useState } from 'react';
import { Brain, CheckCircle2, Clock, RotateCcw, Layers, Users, Target, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profilStore, profilDone, useLocalStoreVersion } from '../../lib/stores';
import { PM, PROFIL_STEPS } from '../../data/profilModel';
import ProfilReport from '../../components/profil/ProfilReport';
import ProfilDownload from '../../components/profil/ProfilDownload';
import { ProfilQuestionnaire, finishProfil, profilTimeLeft } from '../../components/profil/Questionnaires';

export default function ProfilPro() {
  const { profile, company, isLearner } = useAuth();
  useLocalStoreVersion();
  const showWelcome = isLearner;
  const [taking, setTaking] = useState(false);
  const p = profilStore.get(profile.id);
  const done = profilDone(p);
  const canTake = !done || p.retake;

  // Test commencé puis quitté : si le temps est écoulé entre-temps, il est envoyé à l'ouverture de la page
  const expired = Boolean(p.draft?.timerStart) && profilTimeLeft(p.draft) <= 0;
  useEffect(() => {
    if (expired && !taking) finishProfil(profile.id, p.draft, true);
  }, [expired, taking]); // eslint-disable-line react-hooks/exhaustive-deps

  if (taking) return <div className="mx-auto max-w-4xl"><ProfilQuestionnaire userId={profile.id} onDone={() => setTaking(false)} onCancel={() => setTaking(false)} /></div>;

  return (
    <div className="space-y-8">
      {showWelcome && (
        <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-navy-800 ring-1 ring-brand-100">
          <span className="text-xl">🧭</span>
          <p>
            <b>Bienvenue {profile.full_name?.split(' ')[0]} !</b> Pour commencer, votre seule étape est ce <b>test de profil professionnel</b> (20 minutes chronométrées, enregistré au fur et à mesure).
            {done ? ' Merci, votre test est terminé : votre formateur et l’équipe MCE peuvent maintenant consulter votre rapport.' : ' Votre formateur et l’équipe MCE verront votre rapport une fois le test terminé.'}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mon évolution</p>
          <h1 className="page-title">Mon profil professionnel</h1>
          <p className="page-subtitle">Un auto-positionnement pédagogique privé : visible par vous, votre formateur et l’équipe MCE. Aucun classement.</p>
        </div>
        {done && <ProfilDownload profil={p} name={profile.full_name} className="btn-md" />}
      </div>

      {canTake && (
        <section className="no-print relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-navy-800 to-navy-950 p-6 text-white shadow-lift sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
                <Clock className="h-3.5 w-3.5" /> {PM.duration} min chrono (+{PM.grace} min si besoin) · {PROFIL_STEPS.length} étapes · sauvegarde automatique
              </span>
              <h2 className="mt-4 text-3xl font-extrabold">{done ? 'Nouvelle passation ouverte' : 'Découvrez votre profil professionnel'}</h2>
              <p className="mt-2 max-w-2xl text-navy-100">
                {done ? 'Votre formatrice vous invite à refaire le questionnaire pour mesurer votre progression.' : 'Répondez selon vos pratiques habituelles, pas selon la réponse idéale. Vous obtiendrez un rapport détaillé : portrait, diagrammes, forces, axes de progrès et plan d’action.'}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[[Layers, `${PM.dimensions.length} compétences`, `${PM.likertQuestions.length} affirmations`], [Target, '10 situations', 'réelles du travail'], [Users, '5 axes', 'de fonctionnement'], [ShieldCheck, 'Fiabilité', 'des réponses vérifiée']].map(([I, a, b]) => (
                  <div key={a} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <I className="h-5 w-5 text-brand-300" />
                    <p className="mt-1 text-sm font-bold">{a}</p>
                    <p className="text-xs text-navy-200">{b}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setTaking(true)} className="btn bg-white px-8 py-4 text-base text-navy-900 hover:bg-white/90">
              {p.draft ? 'Reprendre où j’en étais' : done ? <><RotateCcw className="h-5 w-5" /> Refaire le test</> : <><Brain className="h-5 w-5" /> Commencer le test</>}
            </button>
          </div>
        </section>
      )}

      {done ? (
        <>
          {!canTake && <p className="no-print flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Test terminé — votre formateur pourra ouvrir une nouvelle passation plus tard pour mesurer vos progrès.</p>}
          <ProfilReport profil={p} name={profile.full_name} />
        </>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-5xl">🧭</p>
          <p className="mt-3 text-lg font-bold text-navy-900">Votre rapport apparaîtra ici</p>
          <p className="mt-1 text-sm text-slate-500">Il sera aussi visible par votre formateur, qui pourra y ajouter ses observations.</p>
        </div>
      )}
    </div>
  );
}
