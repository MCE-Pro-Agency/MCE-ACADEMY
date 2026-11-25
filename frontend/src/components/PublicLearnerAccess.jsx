import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '../config';
import Flag from './Flag';

// Carte d'accès apprenant, posée à cheval sur la photo d'accueil.
export default function PublicLearnerAccess({ connected, spaceLink }) {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const startRegistration = (event) => {
    event.preventDefault();
    const code = joinCode.trim();
    if (!code) return setJoinError('Saisissez le code transmis par votre entreprise.');
    navigate(`/inscription?code=${encodeURIComponent(code)}`);
  };

  return (
    <aside id="acces" className="lx-access" aria-labelledby="access-title">
      <h2 id="access-title">Votre espace apprenant</h2>
      {connected ? <>
        <p>Retrouvez votre parcours, vos résultats et les ressources de votre formation.</p>
        <Link to={spaceLink} className="public-button lx-full">Accéder à mon espace<ArrowRight size={17} aria-hidden="true" /></Link>
      </> : <>
        <p>Votre entreprise vous a transmis un code ? Créez votre compte en une minute.</p>
        <form onSubmit={startRegistration} noValidate>
          <label htmlFor="access-company-code">Code de votre entreprise</label>
          <input id="access-company-code" name="code" maxLength={64} autoComplete="off" placeholder="Saisissez votre code" value={joinCode} aria-describedby={joinError ? 'access-error' : undefined} aria-invalid={Boolean(joinError)} onChange={(event) => { setJoinCode(event.target.value.toUpperCase()); setJoinError(''); }} />
          {joinError && <p id="access-error" className="lx-error" role="alert">{joinError}</p>}
          <button type="submit" className="public-button lx-full">Créer mon compte<ArrowRight size={17} aria-hidden="true" /></button>
        </form>
        <p className="lx-access-login">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </>}
      <div className="lx-access-call">
        <span>Ou appelez-nous</span>
        <ul>
          {BRAND.phones.map(({ label, number, href }) => (
            <li key={label}>
              <a href={href} aria-label={`${label} : ${number}`}><Flag country={label} /><span className="lx-call-country">{label}</span><strong>{number}</strong></a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
