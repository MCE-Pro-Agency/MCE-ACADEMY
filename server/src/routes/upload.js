/* POST /api/upload — fichiers (couvertures, documents, rendus) stockés dans server/uploads */
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../middleware/auth.js';
import { uuid } from '../db.js';
import { HttpError } from '../utils.js';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = /\.(png|jpe?g|gif|webp|svg|pdf|docx?|xlsx?|pptx?|txt|csv|mp4|webm|mov|mp3|m4a|wav|zip)$/i;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = String(req.query.folder || 'uploads').replace(/[^a-z0-9_-]/gi, '') || 'uploads';
    const dir = path.join(UPLOAD_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 200) * 1024 * 1024 },
  fileFilter: (req, file, cb) => (ALLOWED.test(file.originalname) ? cb(null, true) : cb(new HttpError(400, 'Type de fichier non autorisé.'))),
});

const router = Router();
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Aucun fichier reçu.');
  const rel = path.relative(UPLOAD_DIR, req.file.path).split(path.sep).join('/');
  res.json({ url: `/uploads/${rel}` });
});

export default router;
