import 'dotenv/config';
import mysql from 'mysql2/promise';

export const DB_NAME = process.env.DB_NAME || 'mce_academy';

/** Connexion MySQL (pool). Les TINYINT(1) sont renvoyés en booléens, les DECIMAL en nombres. */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: false,
  timezone: 'Z',
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      const v = field.string();
      return v === null ? null : v === '1';
    }
    return next();
  },
});

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export const uuid = () => crypto.randomUUID();

/** Convertit une date JS / ISO en DATETIME MySQL (UTC) */
export function toSqlDate(v) {
  if (v === null || v === undefined || v === '') return v ?? null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toISOString().slice(0, 23).replace('T', ' ');
}
