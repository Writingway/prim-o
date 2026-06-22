# Types refactor - `types.ts` split

Date: 2026-06-15

## Problem

`src/types/types.ts` (140 lines) held every type for the whole app in one
file - same "everything in one place" pain as the old `api.ts`.

## What changed

Split into `src/types/` by domain, with `types.ts` kept as a barrel:

| File          | Contents                                                                 |
|---------------|--------------------------------------------------------------------------|
| `shared.ts`   | `Role`, `Mode`, `ApiResponse`, `AuthSession`, `Paginated`                |
| `offer.ts`    | `OfferCategory`, `Offer`                                                 |
| `employee.ts` | `Employee`, `ReceivedToken`, `SpentToken`                               |
| `company.ts`  | `Company`, `AttributionHistory`                                         |
| `admin.ts`    | `AdminStats`, `AdminRole`, `AdminStatus`, `AdminUser`, `AdminCompany`, `AdminAttribution`, `AdminRedemption` |
| `types.ts`    | barrel - `export * from './shared'` … (re-exports everything)           |

### Win

- **Zero callsite changes.** Every `import { X } from '../types/types'`
  still works because `types.ts` re-exports all domain files.
- Each domain file is small and focused; new types go to the right file.

## Why keep `services/api/` as a folder (decision)

`services/` conventionally holds more than the HTTP client (storage,
formatters, analytics, …). Keeping `api/` as a subfolder leaves room for
those without mixing transport code with future non-API services. The
public import stays `from '../services/api'`.

## Verification

`./node_modules/.bin/tsc --noEmit` → exit 0.
