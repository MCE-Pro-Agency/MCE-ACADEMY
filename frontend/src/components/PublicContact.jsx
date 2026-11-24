import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail, MapPin, Clock, MessageCircle, Globe2 } from 'lucide-react';
import { BRAND } from '../config';

const SOCIAL_ICONS = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };

export function SocialLinks() {
  return (
    <div className="public-socials" role="group" aria-label="Réseaux sociaux MCE">
      {BRAND.socials.map(({ name, href }) => {
        const Icon = SOCIAL_ICONS[name];
        return (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer"
            className="public-social-link">
            <Icon className="h-4 w-4" aria-hidden="true" /> {name}
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        );
      })}
    </div>
  );
}

export function ContactDetails() {
  return (
    <ul className="public-contact-list">
      <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />Dakar, Sénégal · France · Maroc</li>
      {BRAND.phones.map(({ label, number, href }) => (
        <li key={label} className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
          <a href={href} className="hover:text-white">{number} <span className="text-xs text-navy-300">· {label}</span></a>
        </li>
      ))}
      <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" /><a href={`mailto:${BRAND.contactEmail}`} className="break-all hover:text-white">{BRAND.contactEmail}</a></li>
      <li className="flex items-center gap-2.5"><MessageCircle className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" /><a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">Échanger sur WhatsApp<span className="sr-only"> (nouvel onglet)</span></a></li>
      <li className="flex items-center gap-2.5"><Clock className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />Lun – Ven : 9h00 – 18h00</li>
      <li className="flex items-center gap-2.5"><Globe2 className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" /><a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">mceafrika.com<span className="sr-only"> (nouvel onglet)</span></a></li>
    </ul>
  );
}
