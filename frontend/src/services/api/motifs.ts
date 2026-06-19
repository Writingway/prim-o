// Motifs (§3.5) + distribution manager → employé (§3.3) avec motif obligatoire.
// Contrats GELÉS recopiés depuis backend src/contracts/manager.contracts.ts
// et src/schemas/attribution.schemas.ts (createAttributionSchema).
// Endpoints addendum v1.1 pas encore livrés → bascule MOCK. Flip quand Dev A
// (GET /motifs) et Dev B (POST /attributions avec motifId) ont livré.
import { authRequest, type ApiResult } from './client';

// ─── Types (miroir du contrat figé) ──────────────────────────────
export type MotifCategory =
  | 'COMPORTEMENTS_INDIVIDUELS'
  | 'RELATION_CLIENT'
  | 'ESPRIT_COLLECTIF'
  | 'ENGAGEMENT';

export interface MotifDTO {
  id: string;
  tag: string;
  label: string;
  category: MotifCategory;
  compliment: string; // affiché au salarié à la réception
}
export interface ListMotifs {
  categories: Array<{ category: MotifCategory; motifs: MotifDTO[] }>;
}

// POST /api/attributions body (miroir createAttributionSchema).
export interface DistributeInput {
  employeeId: string;
  amount: number;   // entier > 0
  motifId: string;  // requis (plus de texte libre)
  reason?: string;  // note libre optionnelle
}
export interface DistributeResult {
  attributionId: string;
  employeeId: string;
  amount: number;
  motif: { tag: string; compliment: string };
  retributionAmount: number;
  envelopeRemaining: number;
}

// Libellés FR des 4 catégories (pour le sélecteur).
export const CATEGORY_LABELS: Record<MotifCategory, string> = {
  COMPORTEMENTS_INDIVIDUELS: 'Comportements individuels',
  RELATION_CLIENT: 'Relation client',
  ESPRIT_COLLECTIF: 'Esprit collectif',
  ENGAGEMENT: 'Engagement',
};

// ─── Bascule mock A/B ─────────────────────────────────────────────
//
// TECH DEBT (cutover §3.3) : à MOTIF_MOCKS=false, supprimer l'ancienne
// distribution inline de ManagerDashboard.tsx — submitAttrib (ancien shape
// { employeeId, amount, reason } SANS motifId, texte libre obligatoire),
// état attrib* + son formulaire JSX. Remplacée par DistributeForm (motifId
// requis + compliment). À retirer quand POST /attributions accepte motifId.
const MOTIF_MOCKS = true;

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, status: 200, data };
}

const MOCK_MOTIFS: ListMotifs = {
  categories: [
    {
      category: 'COMPORTEMENTS_INDIVIDUELS',
      motifs: [
        { id: 'mo-1', tag: 'INITIATIVE', label: 'Prise d\'initiative', category: 'COMPORTEMENTS_INDIVIDUELS', compliment: 'Ton initiative a fait avancer toute l\'équipe. Bravo !' },
        { id: 'mo-2', tag: 'RIGUEUR', label: 'Rigueur', category: 'COMPORTEMENTS_INDIVIDUELS', compliment: 'Ta rigueur fait la différence au quotidien.' },
      ],
    },
    {
      category: 'RELATION_CLIENT',
      motifs: [
        { id: 'mo-3', tag: 'CLIENT_SATISFAIT', label: 'Client satisfait', category: 'RELATION_CLIENT', compliment: 'Grâce à toi, un client repart avec le sourire.' },
        { id: 'mo-4', tag: 'ECOUTE', label: 'Écoute client', category: 'RELATION_CLIENT', compliment: 'Ton écoute transforme l\'expérience client.' },
      ],
    },
    {
      category: 'ESPRIT_COLLECTIF',
      motifs: [
        { id: 'mo-5', tag: 'ENTRAIDE', label: 'Entraide', category: 'ESPRIT_COLLECTIF', compliment: 'Ton entraide soude toute l\'équipe.' },
        { id: 'mo-6', tag: 'PARTAGE', label: 'Partage de savoir', category: 'ESPRIT_COLLECTIF', compliment: 'Partager ton savoir fait grandir tout le monde.' },
      ],
    },
    {
      category: 'ENGAGEMENT',
      motifs: [
        { id: 'mo-7', tag: 'IMPLICATION', label: 'Implication', category: 'ENGAGEMENT', compliment: 'Ton implication est une vraie force pour nous.' },
        { id: 'mo-8', tag: 'PERSEVERANCE', label: 'Persévérance', category: 'ENGAGEMENT', compliment: 'Ta persévérance inspire l\'équipe entière.' },
      ],
    },
  ],
};

// GET /api/motifs → liste groupée par catégorie.
export function getMotifs(): Promise<ApiResult<ListMotifs>> {
  if (MOTIF_MOCKS) return Promise.resolve(ok(MOCK_MOTIFS));
  return authRequest<ListMotifs>('GET', '/motifs');
}

// POST /api/attributions → distribution + compliment renvoyé.
export function distribute(input: DistributeInput): Promise<ApiResult<DistributeResult>> {
  if (MOTIF_MOCKS) {
    const all = MOCK_MOTIFS.categories.flatMap((c) => c.motifs);
    const m = all.find((x) => x.id === input.motifId) ?? all[0];
    return Promise.resolve(
      ok({
        attributionId: 'mock-' + Date.now(),
        employeeId: input.employeeId,
        amount: input.amount,
        motif: { tag: m.tag, compliment: m.compliment },
        retributionAmount: Math.floor(input.amount * 0.1),
        envelopeRemaining: 320 - input.amount,
      }),
    );
  }
  return authRequest<DistributeResult>('POST', '/attributions', input);
}
