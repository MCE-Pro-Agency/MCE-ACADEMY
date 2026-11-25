// Petits drapeaux en SVG (les emojis drapeaux ne s'affichent pas sous Windows).
const STAR = 'M15 7.6l1.06 3.26h3.43l-2.77 2.02 1.06 3.26L15 14.12l-2.78 2.02 1.06-3.26-2.77-2.02h3.43z';

export default function Flag({ country, className = '' }) {
  const common = { viewBox: '0 0 30 20', className: `public-flag ${className}`, 'aria-hidden': true };
  if (country === 'Sénégal') {
    return (
      <svg {...common}>
        <rect width="10" height="20" fill="#00853F" />
        <rect x="10" width="10" height="20" fill="#FDEF42" />
        <rect x="20" width="10" height="20" fill="#E31B23" />
        <path d={STAR} fill="#00853F" />
      </svg>
    );
  }
  if (country === 'France') {
    return (
      <svg {...common}>
        <rect width="10" height="20" fill="#002395" />
        <rect x="10" width="10" height="20" fill="#FFFFFF" />
        <rect x="20" width="10" height="20" fill="#ED2939" />
      </svg>
    );
  }
  if (country === 'Maroc') {
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#C1272D" />
        <polygon points="15,5 17.94,14.05 10.24,8.45 19.76,8.45 12.06,14.05" fill="none" stroke="#006233" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}
