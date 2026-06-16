# API client refactor — `api.ts` split

Date: 2026-06-15

## Problem

`src/services/api.ts` had grown to 403 lines: it mixed core transport
(token, refresh, request wrappers) with ~25 domain endpoints, and every
endpoint repeated the same response-envelope cast:

```ts
as Promise<{ ok: boolean; status: number; data: SOMETHING | null }>
```

The repeated cast was the "types are all the same" pain.

## What changed

Split into `src/services/api/`:

| File         | Contents                                                        |
|--------------|----------------------------------------------------------------|
| `client.ts`  | token, refresh singleton, `rawRequest`/`post`/`authRequest` — now generic `ApiResult<T>` |
| `auth.ts`    | login, logout, register×2, roleFromToken                        |
| `offers.ts`  | offer CRUD                                                      |
| `employees.ts` | employees + balances                                         |
| `company.ts` | company, attributions, invite                                  |
| `admin.ts`   | all admin endpoints                                            |
| `index.ts`   | barrel re-export                                               |

### Wins

- **Type dup killed.** `authRequest<{ offers: Offer[] }>('GET', '/offers')`
  replaces every `as Promise<{ ok; status; data: ... | null }>` cast.
  ~120 lines of boilerplate gone.
- **No callsite import changes.** All 10 importers keep
  `from "../services/api"` → resolves to `api/index.ts`.
- Old `api.ts` deleted.

### Type fixes triggered by the change

The old `post`/`authRequest` returned `data: any`, so callsites read any
field freely. Generic `ApiResult<T>` made `data` typed (`T | null`), which
surfaced 3 real holes:

- `auth.ts` — typed login (`{ accessToken; error? }`) and register
  (`ValidationErrorBody`) responses.
- `LoginForm.tsx:31` — added null-guard on `res.data?.accessToken`.

## Bug hit during refactor: Vite stale resolution

After deleting `api.ts` while the dev server was running, Vite threw:

```
[vite] (client) Pre-transform error: Failed to load url /src/services/api.ts
(resolved id: /home/project/prim-o/frontend/src/services/api.ts) in
/home/project/prim-o/frontend/src/App.tsx. Does the file exist?
```

**Cause:** Vite cached the module-resolution result pointing at the old
`api.ts`. The import in `App.tsx` is correct (`from './services/api'`, no
`.ts` extension) — it resolves to `api/index.ts` once the cache is fresh.

**Fix:** restart the dev server (stop, `npm run dev`). No code change.

## Verification

`npx tsc --noEmit` → exit 0.
