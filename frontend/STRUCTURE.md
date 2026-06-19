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
2. ~~**Extraire les hooks** — `ManagerDashboard.tsx`~~ ✅ **FAIT** (2026-06-19).
   `useManagerData`, `useAllocation`, `useAttribution` créés dans `hooks/`. 571 → ~390 lignes,
   imports migrés `@/`, build vert, zéro changement de comportement.
   Note : `useAttribution` (pas `useDistribution`) — colle au terme métier du code (`createAttribution`).
   `DistributeForm` (UI manager) est un composant distinct, non touché.
   - ✅ **AdminPage.tsx FAIT** (2026-06-19) : 543 → 295 lignes. Hooks : `useFlash` (toast réutilisable),
     `useAdminOffers` (liste+stats+toggleActive), `useOfferForm` (création/édition), `usePromoCodes`
     (panneau codes : import CSV + add + delete). `ConfirmDialog` exporte maintenant `ConfirmFn`/`ConfirmOptions`
     (le dialog reste dans le composant, les hooks reçoivent `confirm` en callback). Build vert, iso-comportement.
   - ✅ **EmployeeDashboard.tsx FAIT** (2026-06-19) : 220 → 127 lignes. Hooks : `usePaginatedList<T>`
     (générique « voir plus », dédoublonne reçus/dépenses) + `useEmployeeDashboard` (solde + 2 historiques,
     chargement groupé un seul spinner). Build vert, iso-comportement.
   - ✅ **DistributeForm.tsx FAIT** (2026-06-19) : 219 → 149 lignes. `useDistributeForm` (motifs + form + validation Zod-miroir + submit + reset) ; composant = rendu pur. Build vert.
   - ✅ **§2 TERMINÉE** : tous les god-components décomposés (Manager/Admin/Employee dashboards + DistributeForm). Recette hook-par-écran appliquée, zéro big-bang.
3. ~~**Barrels par dossier de composants**~~ ❌ **ÉCARTÉ** (2026-06-19). Net négatif avec Vite (HMR/cold-start ralentis, risque d'imports circulaires, diffs plus gros) ; les imports `@/components/X/Y` sont déjà propres. On n'ajoute pas de barrels confort.
   - ✅ À la place : `lib/format.ts` créé — `formatDate` dédoublonné (ManagerDashboard + EmployeeDashboard). `lib/` = helpers purs partagés.
4. **`employee/` + `admin/`** dans `components/` — quand on redesign ces écrans (moodboard).
5. **Primitives UI partagées** (dette, à faire APRÈS la migration CSS — pas de big-bang avant). Seuil règle-de-trois atteint : `BTN`/`FIELD`/`LABEL`/`INPUT` sont copiés dans `ConfirmDialog`, `privacy/EditProfile`, `privacy/PrivacySection`. Plan :
   - Promouvoir les neutres récurrents en tokens `@theme` (`#d1d5db`, `#4b5563`, `#1f2937`, `#f9fafb`, `#ececf1`, amber badge) → charte = source unique, plus de hex inline.
   - Extraire `components/ui/Button` (variants primary/secondary/danger/danger-solid) + `Field`/`Input` ; `cva` si variants typés voulus, et `tailwind-merge` pour fiabiliser les overrides (`border-transparent` → `border-[…]` repose aujourd'hui sur l'ordre de génération, fragile).
   - Migrer ConfirmDialog + privacy + futurs écrans vers ces primitives. Refactor transverse → session dédiée, build vert à chaque étape.

## Dette CSS → Tailwind (tracker)

Migration incrémentale, pas de big-bang. Supprimer le `.css` quand la page/composant est 100% Tailwind.

| Fichier CSS | Statut | Note |
|---|---|---|
| `index.css` | GARDÉ | tokens charte + `@theme` Tailwind. Reste. |
| `components/layout/layout.css` | partiel (réduit 2026-06-19) | Coquille (layout/header/main/footer + brand/links) migrée Tailwind dans `Layout/Header/Footer.tsx`. Reste **uniquement** `.app-btn*` (bouton header partagé) — encore consommé par 5 pages non migrées (Manager/Admin/Employee/Landing via `headerActions`). Supprimer quand ces pages migrent / passent à `ui/Button` (§5). |
| ~~`components/privacy/privacy.css`~~ | ✅ MIGRÉ (2026-06-19) | supprimé. `EditProfile` + `PrivacySection` 100% Tailwind ; consts `BTN_*`/`FIELD`/`INPUT` locaux (pattern ConfirmDialog). Neutres hors charte (#ececf1, #d1d5db, #1f2937, #4b5563, amber badge) en arbitraires ; teal/error/success/gray via tokens. |
| ~~`components/ui/ConfirmDialog.css`~~ | ✅ MIGRÉ (2026-06-19) | supprimé. Tokens `@theme` + `animate-confirm-fade/pop` ajoutés à `index.css`. |
| `pages/ManagerDashboard.css` | à migrer | nouveaux blocs (§3.3) déjà Tailwind |
| `pages/EmployeeDashboard.css` | à migrer | cible redesign moodboard |
| `pages/AdminPage.css` | à migrer | |
| ~~`pages/AuthPage.css`~~ | ✅ MIGRÉ (2026-06-19) | supprimé. 6 conscommateurs (AuthPage, AuthTabs, Login/Register, ResetPassword, Onboarding) → module partagé `components/auth/authClasses.ts` (consts + `tab(active)`). `role-selector` était dead CSS (aucun consommateur) → parti. Extras non stylés (auth-help/link/resend, onboarding-intro) reçoivent style minimal. Fix collision : state `tab`→`tabKey` dans Onboarding (vs helper `tab()`). |
| `pages/LandingPage.css` | à migrer | |
| ~~`pages/LegalPage.css`~~ | ✅ MIGRÉ (2026-06-19) | supprimé. Consts prose `TITLE/UPDATED/H2/P/UL` + `Todo`. 2 fixes : `legal-updated` rendait mal (specificity `.legal-card p` > `.legal-updated`) → now text-[13px] gray-light ; listes sans puces (preflight reset) → `list-disc`. |

Nouveau code = **Tailwind only**, zéro nouveau `.css`.
