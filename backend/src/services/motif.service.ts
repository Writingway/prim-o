import { prisma } from '../lib/db';

// Motifs officiels actifs, groupés par catégorie dans l'ordre métier.
// Conforme à ListMotifsResponse (contracts). Source du sélecteur de motif.
const CATEGORY_ORDER = [
  'COMPORTEMENTS_INDIVIDUELS',
  'RELATION_CLIENT',
  'ESPRIT_COLLECTIF',
  'ENGAGEMENT',
] as const;

export async function listActiveMotifs() {
  const motifs = await prisma.motif.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, tag: true, label: true, category: true, compliment: true },
  });
  const categories = CATEGORY_ORDER
    .map((category) => ({ category, motifs: motifs.filter((m) => m.category === category) }))
    .filter((g) => g.motifs.length > 0);
  return { categories };
}
