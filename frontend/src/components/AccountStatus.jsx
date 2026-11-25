/* Statut réel d'un compte (lu dans Supabase Auth par l'API : GET /api/users/status). */
import { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export const ACCOUNT_STATUS = {
  invited: { label: 'Invitation en attente', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  unconfirmed: { label: 'E-mail non confirmé', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  confirmed: { label: 'E-mail confirmé', className: 'bg-sky-50 text-sky-800 ring-sky-200' },
  active: { label: 'Compte actif', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  disabled: { label: 'Compte désactivé', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

/** Charge les statuts des comptes visibles par l'utilisateur connecté. */
export function useAccountStatuses(companyId) {
  const [statuses, setStatuses] = useState({});
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    try {
      const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
      const res = await api(`/users/status${query}`);
      setStatuses(res.statuses || {});
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [companyId]);
  useEffect(() => { reload(); }, [reload]);
  return { statuses, statusError: error, reloadStatuses: reload };
}

export function AccountStatusBadge({ status }) {
  const info = ACCOUNT_STATUS[status?.status];
  if (!info) return <span className="text-xs text-slate-400">—</span>;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span>;
}

/** Bouton « Renvoyer l'invitation », affiché seulement si l'adresse n'est pas confirmée. */
export function ResendInviteButton({ userId, status, onDone }) {
  const [sending, setSending] = useState(false);
  if (!['invited', 'unconfirmed'].includes(status?.status)) return null;
  const send = async () => {
    setSending(true);
    try {
      await api(`/users/${userId}/invite`, { method: 'POST' });
      toast.success('Invitation renvoyée.');
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };
  return (
    <button type="button" onClick={send} disabled={sending} className="btn-ghost btn-sm" title="Renvoyer l’invitation" aria-label="Renvoyer l’invitation">
      <Send className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
