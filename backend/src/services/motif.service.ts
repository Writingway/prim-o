import { prisma } from '../lib/db';
import type { ListMotifsResponse, MotifDTO, MotifCategory } from '../contracts/manager.contracts';

// Ordre d'affichage des catégories (§3.5) — stable, indépendant du sortOrder intra-catégorie.
const CATEGORY_ORDER: MotifCategory[] = [
  'COMPORTEMENTS_INDIVIDUELS',
  'RELATION_CLIENT',
  'ESPRIT_COLLECTIF',
  'ENGAGEMENT',
];

// §3.5 — liste officielle des motifs actifs, triés sortOrder, groupés par catégorie.
export async function listMotifs(): Promise<ListMotifsResponse> {
  const motifs = await prisma.motif.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, tag: true, label: true, category: true, compliment: true },
  });

  const byCategory = new Map<MotifCategory, MotifDTO[]>();
  for (const m of motifs) {
    const dto: MotifDTO = {
      id: m.id,
      tag: m.tag,
      label: m.label,
      category: m.category,
      compliment: m.compliment,
    };
    const list = byCategory.get(m.category);
    if (list) list.push(dto);
    else byCategory.set(m.category, [dto]);
  }

  const categories = CATEGORY_ORDER
    .filter((c) => byCategory.has(c))
    .map((category) => ({ category, motifs: byCategory.get(category)! }));

  return { categories };
}
