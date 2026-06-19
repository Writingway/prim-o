# Front prim-o — convention de structure (vue senior)

## Verdict

Le front est en **type-based (par type)** et c'est cohérent pour un projet de
cette taille, maintenu par des juniors. On ne fait **pas** de big-bang vers du
feature-sliced : sans tests, ça n'apporte que du risque. On vise une version
**raffinée du type-based**, migrée **au fil de l'eau**.

```
src/
  components/   {ui, layout, auth, manager, privacy, ...}   composants par feature/role
  pages/        une page = un écran routé
  hooks/        (À CRÉER) logique data extraite des god-components
  services/api/ transport + appels par domaine + barrel index.ts   ← couche propre
  types/        types par domaine + barrel types.ts                ← déjà propre (barrel)
  lib/          (optionnel) helpers purs
  router.tsx    routes TanStack
```

## Fait

- **Alias `@/` → `src/`** (tsconfig `paths` + vite `resolve.alias`). Additif :
  les imports relatifs existants marchent toujours. Nouveau code : préférer
  `import X from '@/components/...'` au lieu de `../../`.
- `services/api` + `types` : barrels propres, rien à changer.

## Faux smell écarté

`types/types.ts` n'est **pas** un fourre-tout : c'est un **barrel** qui ré-exporte
les fichiers par domaine (même pattern que `services/api/index.ts`). Vérifié, on n'y touche pas.

## Roadmap (phases, chacune build vert + stagée à part)

1. **Imports `@/`** — migrer les `../../` opportunistiquement quand on touche un fichier. Pas de PR dédiée massive.
2. **Extraire les hooks** — `ManagerDashboard.tsx` (~560 lignes) fait fetch+state+5 sections inline.
   Sortir `useManagerData`, `useAllocation`, `useDistribution` dans `hooks/`. Forte valeur, à faire écran par écran.
3. **Barrels par dossier de composants** — `components/manager/index.ts` etc. (confort, faible priorité).
4. **`employee/` + `admin/`** dans `components/` — quand on redesign ces écrans (moodboard).

## Dette CSS → Tailwind (tracker)

Migration incrémentale, pas de big-bang. Supprimer le `.css` quand la page/composant est 100% Tailwind.

| Fichier CSS | Statut | Note |
|---|---|---|
| `index.css` | GARDÉ | tokens charte + `@theme` Tailwind. Reste. |
| `components/layout/layout.css` | partiel | footer public encore stylé ici |
| `components/privacy/privacy.css` | à migrer | |
| `components/ui/ConfirmDialog.css` | à migrer | |
| `pages/ManagerDashboard.css` | à migrer | nouveaux blocs (§3.3) déjà Tailwind |
| `pages/EmployeeDashboard.css` | à migrer | cible redesign moodboard |
| `pages/AdminPage.css` | à migrer | |
| `pages/AuthPage.css` | à migrer | |
| `pages/LandingPage.css` | à migrer | |
| `pages/legal.css` | à migrer | |

Nouveau code = **Tailwind only**, zéro nouveau `.css`.
