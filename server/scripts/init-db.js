/**
 * Crée la base MySQL et toutes les tables à partir de database/schema.sql
 * Usage : cd server && npm run db:init
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.DB_NAME || 'mce_academy';
let sql = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8');
sql = sql.replaceAll('mce_academy', DB);

try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  await conn.query(sql);

  // Migrations des bases déjà créées (colonnes ajoutées après coup)
  const MIGRATIONS = [
    ['companies', 'learner_space', "ALTER TABLE companies ADD COLUMN learner_space ENUM('test','complet') NOT NULL DEFAULT 'complet' AFTER is_active"],
  ];
  for (const [table, column, ddl] of MIGRATIONS) {
    const [[found]] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?', [DB, table, column]);
    if (!found.n) {
      await conn.query(`USE \`${DB}\``);
      await conn.query(ddl);
      console.log(`• Colonne ajoutée : ${table}.${column}`);
    }
  }
  const [tables] = await conn.query('SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [DB]);
  console.log(`✅ Base « ${DB} » prête (${tables.length} tables) : ${tables.map((t) => t.t).join(', ')}`);
  await conn.end();
} catch (e) {
  console.error(`❌ Impossible de créer la base : ${e.message}`);
  if (e.code === 'ER_ACCESS_DENIED_ERROR') console.error('   → Vérifiez DB_USER / DB_PASSWORD dans server/.env');
  if (e.code === 'ECONNREFUSED') console.error('   → MySQL ne semble pas démarré (port ' + (process.env.DB_PORT || 3306) + ').');
  process.exit(1);
}
