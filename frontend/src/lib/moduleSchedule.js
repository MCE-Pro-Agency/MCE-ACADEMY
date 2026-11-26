export function moduleTitle(title = '') {
  return title.replace(/^(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|jour\s*\d+)\s*[·:–—-]\s*/i, '');
}
export function scheduleLabel(date) {
  if (!date) return 'Date à définir';
  const d = new Date(`${String(date).slice(0,10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? 'Date à définir' : d.toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
