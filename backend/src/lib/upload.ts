import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

// Upload storage root. __dirname is src/lib (ts-node) or dist/lib (build); either way
// ../../uploads resolves to backend/uploads.
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const OFFERS_DIR = path.join(UPLOADS_DIR, 'offers');

// Web prefix stored in DB; files are served statically under /api/uploads (see server.ts).
export const OFFERS_PUBLIC_PREFIX = '/uploads/offers';

// Accepted MIME types mapped to the extension we assign. The client NEVER picks the filename.
const ALLOWED = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, OFFERS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? '';
    cb(null, `${crypto.randomUUID()}${ext}`); // random name: no path traversal
  },
});

// Offer photo upload middleware: single file in field "image", 2 MB max, jpeg/png/webp only -
// all enforced server-side, the client decides nothing.
export const offerImageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_IMAGE_TYPE'));
  },
}).single('image');

// Delete an uploaded file given its web path (/uploads/offers/x). Best-effort: a missing file
// is ignored. Traversal guard: refuses anything that resolves outside UPLOADS_DIR.
export async function removeUploadedFile(imageUrl: string): Promise<void> {
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const abs = path.join(UPLOADS_DIR, rel);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) return;
  await fs.unlink(abs).catch(() => { /* already gone */ });
}
