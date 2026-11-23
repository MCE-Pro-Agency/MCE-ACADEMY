/* =====================================================================
   Moteur de requêtes MySQL utilisé par /api/db
   Reçoit une requête décrite par le frontend (table, colonnes, filtres,
   relations imbriquées, écriture) et l'exécute en appliquant TOUJOURS
   les règles d'accès de policies.js.
   ===================================================================== */
import { pool, query, uuid, toSqlDate, DB_NAME } from './db.js';
import { POLICIES } from './policies.js';
import { HttpError } from './utils.js';

/* ---------- Métadonnées des tables (colonnes, types, clés) ---------- */
let META = null;
const PK = {
  lesson_progress: ['user_id', 'lesson_id'],
  quiz_answers: ['question_id'],
  module_settings: ['module_id'],
  profile_assessments: ['user_id'],
};
const pkOf = (table) => PK[table] || ['id'];
/* Colonnes JSON (MariaDB les stocke en texte : on les convertit dans les deux sens) */
const JSON_COLS = { quiz_questions: ['options'], quiz_attempts: ['answers'], profile_assessments: ['runs', 'draft'] };
export function parseJsonCols(table, row) {
  for (const c of JSON_COLS[table] || []) {
    if (typeof row[c] === 'string') {
      try {
        row[c] = JSON.parse(row[c]);
      } catch {
        /* valeur laissée telle quelle */
      }
    }
  }
  return row;
}

export async function loadMeta() {
  const rows = await query(
    'SELECT TABLE_NAME AS t, COLUMN_NAME AS c, DATA_TYPE AS d FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?',
    [DB_NAME]
  );
  META = {};
  for (const r of rows) {
    META[r.t] ??= { cols: {}, list: [] };
    META[r.t].cols[r.c] = r.d;
    META[r.t].list.push(r.c);
  }
  return META;
}
async function meta(table) {
  if (!META) await loadMeta();
  if (!META[table] || !POLICIES[table]) throw new HttpError(400, `Table inconnue : ${table}`);
  return META[table];
}
const ident = (s) => {
  if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new HttpError(400, `Identifiant invalide : ${s}`);
  return `\`${s}\``;
};

/* ---------- Analyse de la chaîne select (syntaxe type Supabase) ---------- */
function splitTop(str) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
export function parseSelect(str = '*') {
  const node = { cols: [], embeds: [] };
  for (const tok of splitTop(str || '*')) {
    const m = tok.match(/^(?:([a-z_][a-z0-9_]*):)?([a-z_][a-z0-9_]*)(?:!([a-z0-9_]+))?\s*\((.*)\)$/is);
    if (m) {
      const [, alias, target, hint, inner] = m;
      if (inner.trim() === 'count') node.embeds.push({ alias: alias || target, target, hint, count: true, inner: false });
      else node.embeds.push({ alias: alias || target, target, hint, select: parseSelect(inner), inner: hint === 'inner' });
    } else node.cols.push(tok);
  }
  return node;
}

const singular = (t) => (t.endsWith('ies') ? `${t.slice(0, -3)}y` : t.replace(/s$/, ''));

/** Détermine la relation entre deux tables */
async function relation(parent, e) {
  const pm = await meta(parent);
  const tm = await meta(e.target);
  if (e.hint && e.hint !== 'inner') {
    const fk = e.hint.match(new RegExp(`^${parent}_(.+)_fkey$`));
    if (fk && pm.cols[fk[1]]) return { kind: 'one', local: fk[1], remote: 'id' };
  }
  if (pm.cols[`${e.alias}_id`] && e.alias !== e.target) return { kind: 'one', local: `${e.alias}_id`, remote: 'id' };
  if (pm.cols[`${singular(e.target)}_id`]) return { kind: 'one', local: `${singular(e.target)}_id`, remote: 'id' };
  if (tm.cols[`${singular(parent)}_id`]) return { kind: 'many', local: 'id', remote: `${singular(parent)}_id` };
  throw new HttpError(400, `Relation inconnue : ${parent} → ${e.target}`);
}

/* ---------- Lecture ---------- */
function whereFilters(filters, m) {
  const sql = [];
  const params = [];
  for (const f of filters) {
    if (f.col.includes('.')) continue; // filtre sur une relation : appliqué après coup
    if (!m.cols[f.col]) throw new HttpError(400, `Colonne inconnue : ${f.col}`);
    const c = `t.${ident(f.col)}`;
    if (f.op === 'eq') {
      if (f.val === null) sql.push(`${c} IS NULL`);
      else {
        sql.push(`${c} = ?`);
        params.push(typeof f.val === 'boolean' ? Number(f.val) : f.val);
      }
    } else if (f.op === 'neq') {
      sql.push(`${c} <> ?`);
      params.push(f.val);
    } else if (f.op === 'in') {
      if (!Array.isArray(f.val) || !f.val.length) sql.push('1=0');
      else {
        sql.push(`${c} IN (?)`);
        params.push(f.val);
      }
    } else if (['gt', 'gte', 'lt', 'lte'].includes(f.op)) {
      sql.push(`${c} ${{ gt: '>', gte: '>=', lt: '<', lte: '<=' }[f.op]} ?`);
      params.push(f.val);
    } else throw new HttpError(400, `Opérateur non supporté : ${f.op}`);
  }
  return { sql, params };
}

async function selectRows(me, table, { filters = [], order = [], limit, extraWhere } = {}) {
  const m = await meta(table);
  const pol = POLICIES[table].read(me);
  const w = whereFilters(filters, m);
  const where = [`(${pol.sql})`, ...w.sql, ...(extraWhere ? [extraWhere.sql] : [])];
  const params = [...pol.params, ...w.params, ...(extraWhere ? extraWhere.params : [])];
  let sql = `SELECT t.* FROM ${ident(table)} t WHERE ${where.join(' AND ')}`;
  if (order.length) sql += ` ORDER BY ${order.map((o) => `t.${ident(o.col)} ${o.asc === false ? 'DESC' : 'ASC'}`).join(', ')}`;
  if (limit) sql += ` LIMIT ${Number(limit)}`;
  const rows = await query(sql, params);
  return rows.map((r) => strip(table, r));
}
const strip = (table, row) => {
  for (const h of POLICIES[table].hidden || []) delete row[h];
  return parseJsonCols(table, row);
};

function project(rows, node) {
  if (node.cols.includes('*')) return rows;
  const keep = new Set([...node.cols, ...node.embeds.map((e) => e.alias)]);
  for (const r of rows) for (const k of Object.keys(r)) if (!keep.has(k)) delete r[k];
  return rows;
}

/** Ajoute les relations imbriquées (récursif). La projection se fait après rattachement. */
async function shape(me, table, rows, node) {
  for (const e of node.embeds) {
    const rel = await relation(table, e);
    const keys = [...new Set(rows.map((r) => r[rel.local]).filter((v) => v !== null && v !== undefined))];
    const tm = await meta(e.target);
    const related = keys.length
      ? await selectRows(me, e.target, { extraWhere: { sql: `t.${ident(rel.remote)} IN (?)`, params: [keys] }, order: tm.cols.position ? [{ col: 'position' }] : [] })
      : [];
    if (!e.count) await shape(me, e.target, related, e.select);
    for (const r of rows) {
      const matches = related.filter((x) => x[rel.remote] === r[rel.local]);
      if (e.count) r[e.alias] = [{ count: matches.length }];
      else r[e.alias] = rel.kind === 'one' ? matches[0] || null : matches;
    }
    if (!e.count) project(related, e.select);
  }
  return rows;
}

export async function runSelect(me, q) {
  const node = parseSelect(q.columns);
  const nested = (q.filters || []).filter((f) => f.col.includes('.'));
  const innerEmbeds = node.embeds.filter((e) => e.inner);
  const postFilter = nested.length || innerEmbeds.length;
  let rows = await selectRows(me, q.table, { filters: q.filters, order: q.order || [], limit: postFilter ? undefined : q.limit });
  rows = await shape(me, q.table, rows, node);
  if (innerEmbeds.length) rows = rows.filter((r) => innerEmbeds.every((e) => (Array.isArray(r[e.alias]) ? r[e.alias].length : r[e.alias])));
  for (const f of nested) {
    const [alias, col] = f.col.split('.');
    rows = rows.filter((r) => {
      const v = r[alias]?.[col];
      return f.op === 'in' ? f.val.includes(v) : v === f.val;
    });
  }
  if (postFilter && q.limit) rows = rows.slice(0, q.limit);
  project(rows, node);
  return rows;
}

/* ---------- Écriture ---------- */
async function serialize(table, row) {
  const m = await meta(table);
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (!m.cols[k]) continue; // colonnes inconnues ignorées
    const type = m.cols[k];
    if (type === 'json' || (JSON_COLS[table] || []).includes(k)) out[k] = v === null || v === undefined ? null : JSON.stringify(v);
    else if (['datetime', 'timestamp'].includes(type)) out[k] = toSqlDate(v);
    else if (type === 'date') out[k] = v ? String(v).slice(0, 10) : null;
    else if (typeof v === 'boolean') out[k] = Number(v);
    else if (v !== null && typeof v === 'object' && !(v instanceof Date)) out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}
const pkWhere = (table, row) => {
  const pk = pkOf(table);
  return { sql: pk.map((k) => `${ident(k)} = ?`).join(' AND '), params: pk.map((k) => row[k]) };
};
async function fetchByPk(table, row) {
  const w = pkWhere(table, row);
  const [rows] = await pool.query(`SELECT * FROM ${ident(table)} WHERE ${w.sql}`, w.params);
  return rows[0] ? strip(table, rows[0]) : null;
}
async function afterWrite(table, row) {
  if (table === 'lesson_progress' && row?.user_id && row?.course_id) await refreshEnrollment(row.user_id, row.course_id);
}
export async function refreshEnrollment(userId, courseId) {
  await pool.query('INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)', [uuid(), userId, courseId]);
  await pool.query(
    `UPDATE enrollments e SET completed_at = CASE
       WHEN (SELECT COUNT(*) FROM lessons WHERE course_id = ?) > 0
        AND (SELECT COUNT(*) FROM lesson_progress WHERE course_id = ? AND user_id = ? AND completed = 1) >= (SELECT COUNT(*) FROM lessons WHERE course_id = ?)
       THEN COALESCE(e.completed_at, CURRENT_TIMESTAMP(3)) ELSE NULL END
     WHERE e.user_id = ? AND e.course_id = ?`,
    [courseId, courseId, userId, courseId, userId, courseId]
  );
}

async function insertRow(me, table, values) {
  const m = await meta(table);
  const next = { ...values };
  if (m.cols.id && !next.id && pkOf(table)[0] === 'id') next.id = uuid();
  if (!(await POLICIES[table].write(me, 'insert', next, null))) throw new HttpError(403, `Action non autorisée sur ${table}.`);
  const data = await serialize(table, next);
  const cols = Object.keys(data);
  await pool.query(`INSERT INTO ${ident(table)} (${cols.map(ident).join(', ')}) VALUES (?)`, [cols.map((c) => data[c])]);
  const row = await fetchByPk(table, next);
  await afterWrite(table, row);
  return row;
}
async function updateRow(me, table, prev, values) {
  const next = { ...values };
  for (const k of pkOf(table)) delete next[k];
  if (!(await POLICIES[table].write(me, 'update', next, prev))) throw new HttpError(403, `Action non autorisée sur ${table}.`);
  const data = await serialize(table, next);
  if (Object.keys(data).length) {
    const w = pkWhere(table, prev);
    await pool.query(`UPDATE ${ident(table)} SET ? WHERE ${w.sql}`, [data, ...w.params]);
  }
  const row = await fetchByPk(table, prev);
  await afterWrite(table, row);
  return row;
}

/** Ligne existante pour un upsert (clé de conflit ou clé primaire) */
async function findExisting(table, row, onConflict) {
  const cols = onConflict ? onConflict.split(',').map((s) => s.trim()) : pkOf(table);
  if (cols.some((c) => row[c] === undefined)) return null;
  const [rows] = await pool.query(`SELECT * FROM ${ident(table)} WHERE ${cols.map((c) => `${ident(c)} = ?`).join(' AND ')}`, cols.map((c) => row[c]));
  return rows[0] || null;
}

export async function runWrite(me, q) {
  const list = Array.isArray(q.values) ? q.values : q.values ? [q.values] : [];
  const out = [];
  if (q.action === 'insert') {
    for (const v of list) out.push(await insertRow(me, q.table, v));
  } else if (q.action === 'upsert') {
    for (const v of list) {
      const prev = await findExisting(q.table, v, q.onConflict);
      if (prev) {
        if (q.ignoreDuplicates) continue;
        out.push(await updateRow(me, q.table, prev, v));
      } else out.push(await insertRow(me, q.table, v));
    }
  } else if (q.action === 'update' || q.action === 'delete') {
    if (!(q.filters || []).length) throw new HttpError(400, 'Filtre obligatoire pour modifier ou supprimer.');
    const targets = await selectRows(me, q.table, { filters: q.filters });
    for (const prev of targets) {
      const full = await fetchByPk(q.table, prev);
      if (q.action === 'update') out.push(await updateRow(me, q.table, full, q.values));
      else {
        if (!(await POLICIES[q.table].write(me, 'delete', {}, full))) throw new HttpError(403, `Suppression non autorisée sur ${q.table}.`);
        const w = pkWhere(q.table, full);
        await pool.query(`DELETE FROM ${ident(q.table)} WHERE ${w.sql}`, w.params);
        out.push(full);
      }
    }
  } else throw new HttpError(400, 'Action inconnue.');
  return out.filter(Boolean);
}
