/* =====================================================================
   Programme de la formation : un module par jour, puis le suivi J+30.
   Les titres de modules commencent par le jour (« Lundi · … », « J+7 · … »).
   ===================================================================== */
import { THEMES } from './ressources';

export const PROGRAMME = [
  { day: 'Lundi', theme: 'comm', module: 'Communication interpersonnelle' },
  { day: 'Mardi', theme: 'lead', module: 'Leadership et management' },
  { day: 'Mercredi', theme: 'hyg', module: 'Hygiène de vie et propreté (hommes et femmes)' },
  { day: 'Jeudi', theme: 'parole', module: 'Prise de parole en public' },
  { day: 'Vendredi', theme: 'reun', module: "Animation de réunions et communication d'influence" },
  { day: 'Après', theme: null, module: 'Suivi à J+7, J+14, J+21 et J+30' },
];

const FOLLOW_UP_THEME = { 'J+7': 'comm', 'J+14': 'lead', 'J+21': 'parole', 'J+30': 'reun' };
const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

/** Jour, thème et libellé court d'un module à partir de son titre */
export function moduleMeta(module) {
  const title = module?.title || '';
  const [prefix, ...rest] = title.split(' · ');
  const label = rest.length ? rest.join(' · ') : title;
  const followUp = /^J\+\d+$/.test(prefix);
  const day = rest.length ? prefix : null;
  const themeId = followUp ? FOLLOW_UP_THEME[prefix] : THEMES.find((t) => title.includes(t.nom) || label.startsWith(t.nom.split(' (')[0]))?.id;
  const theme = THEME_BY_ID[themeId] || null;
  return { day, label, followUp, theme, color: theme?.color || '#30567E', icon: theme?.icon || '📘' };
}
