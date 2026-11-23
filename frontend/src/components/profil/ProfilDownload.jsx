/* Bouton « Télécharger le rapport de profil (PDF) » — apprenant, formateur et admin */
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadProfilPdf } from '../../lib/pdf';
import * as profilModel from '../../data/profilModel';
import { lastRun } from '../../lib/stores';
import { cn } from '../../lib/utils';

export default function ProfilDownload({ profil, name, className, label = 'Télécharger le rapport (PDF)' }) {
  const [busy, setBusy] = useState(false);
  const run = lastRun(profil);
  if (!run) return null;
  const go = async () => {
    setBusy(true);
    try {
      await downloadProfilPdf({ run, name, comment: profil.comment, model: profilModel });
    } catch (e) {
      toast.error(e?.message || 'Téléchargement impossible.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={go} disabled={busy} className={cn('btn-brand btn-sm no-print', className)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {label}
    </button>
  );
}
