/* POST /api/db — requêtes de données du frontend (lecture / écriture) avec contrôle d'accès */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runSelect, runWrite } from '../query.js';
import { ah } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/',
  ah(async (req, res) => {
    const q = req.body || {};
    const action = q.action || 'select';
    let rows = action === 'select' ? await runSelect(req.profile, q) : await runWrite(req.profile, { ...q, action });

    // après une écriture, .select('…') renvoie les lignes avec les colonnes demandées
    if (action !== 'select' && q.returning && q.columns && q.columns !== '*' && rows.length) {
      const pk = rows[0].id !== undefined ? 'id' : null;
      if (pk) rows = await runSelect(req.profile, { table: q.table, columns: q.columns, filters: [{ col: 'id', op: 'in', val: rows.map((r) => r.id) }] });
    }

    const count = q.count ? rows.length : undefined;
    if (q.head) return res.json({ data: null, count });
    if (q.single || q.maybeSingle) {
      if (rows.length > 1) return res.status(406).json({ error: 'Plusieurs lignes renvoyées alors qu’une seule était attendue.' });
      if (!rows.length && q.single) return res.status(406).json({ error: 'Aucune ligne trouvée.', code: 'PGRST116' });
      return res.json({ data: rows[0] || null, count });
    }
    res.json({ data: action === 'select' || q.returning ? rows : null, count });
  })
);

export default router;
