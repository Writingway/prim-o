import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

// Stockage des fichiers uploadés. __dirname → src/lib (ts-node) ou dist/lib
// (build) ; dans les deux cas ../../uploads pointe sur backend/uploads.
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const OFFERS_DIR = path.join(UPLOADS_DIR, 'offers');

// Préfixe web (stocké en DB) → servi en statique sous /api/uploads (cf. server.ts).
export const OFFERS_PUBLIC_PREFIX = '/uploads/offers';

// Types acceptés → extension de fichier. Le client ne choisit JAMAIS le nom.
const ALLOWED = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, OFFERS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? '';
    cb(null, `${crypto.randomUUID()}${ext}`); // nom aléatoire → pas de traversée de chemin
  },
});

// Middleware d'upload d'une photo d'offre : 1 fichier, champ « image », 2 Mo max,
// types image/jpeg|png|webp uniquement (refus côté serveur, le client ne décide rien).
export const offerImageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_IMAGE_TYPE'));
  },
}).single('image');

// Supprime un fichier uploadé à partir de son chemin web (/uploads/offers/x).
// Best-effort : ignore l'absence. Garde-fou anti-traversée : reste sous UPLOADS_DIR.
export async function removeUploadedFile(imageUrl: string): Promise<void> {
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const abs = path.join(UPLOADS_DIR, rel);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) return;
  await fs.unlink(abs).catch(() => { /* déjà absent */ });
}
