/* Lecture des erreurs renvoyées par Supabase dans l'URL après un clic sur un lien e-mail
   (confirmation, invitation, réinitialisation). Ex. : #error=access_denied&error_code=otp_expired */
export function linkErrorMessage(location) {
  const params = new URLSearchParams(`${location.search.slice(1)}&${location.hash.replace(/^#/, '')}`);
  const code = params.get('error_code');
  const error = params.get('error');
  if (!code && !error) return '';
  if (code === 'otp_expired') return 'Ce lien a expiré ou a déjà été utilisé.';
  return params.get('error_description')?.replace(/\+/g, ' ') || 'Le lien reçu par e-mail n’est pas valide.';
}

/** Adresse de retour après la confirmation de l'inscription. */
export const confirmRedirect = () => `${window.location.origin}/login?confirme=1`;

/** Délai minimum entre deux renvois d'e-mail depuis le navigateur (Supabase limite aussi côté serveur). */
export const RESEND_DELAY = 60;
