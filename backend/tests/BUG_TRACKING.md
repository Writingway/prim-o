# Prim'O - Bug Register (Stage 4 QA)

**Last updated:** 2026-07-03
**Current test state:** 98/98 passing (20 unit + 78 integration). See [test_result.md](test_result.md).

Six bugs found during the Stage 4 QA pass, all fixed. Details below.

## Bugs

| ID | Severity | Area | Bug | Status |
|----|----------|------|-----|--------|
| BUG-1 | 🔴 High | `frontend/package.json` | `"test"` key sat outside `"scripts"` -> `npm test` failed with `Missing script: "test"` | ✅ Fixed - moved into `scripts` |
| BUG-2 | 🟠 Medium | onboarding test | Old smoke test assumed `register` returns a token; email-verification gate broke it | ✅ Fixed - now covered by `integration/onboarding.test.ts` |
| BUG-3 | 🟡 Low | admin test | Old admin script called 2 removed routes (`GET /admin/users/:id`, `GET /admin/companies/:id`) | ✅ Fixed - now covered by `integration/admin.test.ts` |
| BUG-4 | 🟡 Low | `backend` | No test framework; all coverage was shell scripts against a live DB | ✅ Fixed - Vitest + Supertest added |
| BUG-5 | 🔴 High | `privacy.service.ts` | `GET /api/me/export` selected a dropped `User.status` field -> Prisma crash -> **500 for every user** (GDPR export fully broken) | ✅ Fixed - dead field removed; regression test in `privacy.test.ts` |
| BUG-6 | 🟡 Low | `offer.controller.ts` | `GET /api/offers/:id` with malformed uuid crashed Prisma -> **500** instead of 400 | ✅ Fixed - uuid validated before query; regression test in `catalog.test.ts` |

## Notes

- **BUG-5 and BUG-6** were found by the new endpoint tests - both were account-first refactor drift no prior test would have caught.
- **BUG-2, BUG-3, BUG-4** are resolved structurally: the old shell scripts (`smoke.sh`, `admin/run.sh`) were retired and replaced by the Vitest suites. The backend test tree is now `unit/` + `integration/` only.
- Every fix has a test that fails if the bug returns.
