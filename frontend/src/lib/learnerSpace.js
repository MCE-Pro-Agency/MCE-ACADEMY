/* =====================================================================
   Ouverture de l'espace apprenant, réglée par entreprise (companies.learner_space)
   - 'test'    : seul le test de profil professionnel est accessible
   - 'complet' : programme, modules, mémos, documents, notes
   Le serveur applique la même règle (server/src/policies.js) : en mode 'test',
   aucun cours, leçon, quiz ni document n'est envoyé à un apprenant.
   ===================================================================== */
export const LEARNER_SPACES = {
  test: { label: 'Test de profil uniquement', hint: 'Les apprenants ne voient que leur test de profil professionnel.' },
  complet: { label: 'Espace complet', hint: 'Programme, modules (selon le déblocage), mémos, documents et notes.' },
};

/** Pages accessibles à un apprenant quand seul le test est ouvert */
export const TEST_ONLY_PATHS = ['/app/mon-profil', '/app/profil'];

export const isTestOnly = (company) => company?.learner_space === 'test';
