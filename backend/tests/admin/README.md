# Admin API tests

Smoke tests + living documentation for every `/api/admin` endpoint.

## Files
- `run.sh` — runs each endpoint against a live backend and regenerates `RESULTS.md`.
- `RESULTS.md` — captured curl command + HTTP status + JSON body for each endpoint. Generated; do not edit by hand.

## Run
```bash
# backend must be running (npm run dev) and the DB seeded (npx prisma db seed)
bash tests/admin/run.sh
# against another host:
BASE=https://api.example.com/api bash tests/admin/run.sh
```

## Notes
- Bearer tokens are captured at runtime and **never written** to `RESULTS.md` (shown as `$TOKEN`).
- The script logs in with the seeded accounts `admin@primo.fr` / `boss@acme.fr` (password `password123`). For a real deployment, change these or pass them in.
- Most steps are reversible (reject→approve, company delete→restore). The last step (`Soft-delete an employee`) has **no undo** — re-run `npx prisma db seed` to reset the database afterwards.

## Coverage (expected results)
| Endpoint | Case | Expected |
|---|---|---|
| `GET /admin/users` | list | 200 |
| `GET /admin/users` | no token | 401 |
| `GET /admin/users` | manager token | 403 |
| `GET /admin/users/:id` | valid | 200 |
| `GET /admin/users/:id` | bad UUID | 400 |
| `GET /admin/users/:id` | unknown UUID | 404 |
| `PATCH /admin/users/:id` | reject / approve | 200 |
| `PATCH /admin/users/:id` | self | 400 |
| `DELETE /admin/users/:id` | self | 400 |
| `DELETE /admin/users/:id` | employee | 200 |
| `DELETE /admin/companies/:id` | cascade | 200 |
| `POST /admin/companies/:id/restore` | restore | 200 |
