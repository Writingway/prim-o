# Prim'O - Manual Test Plan (Browser QA)

**Purpose:** front-end ↔ back-end integration checks done by hand in the browser.
Covers the UI layer the automated backend tests do not (rendering, navigation,
real Stripe redirect, email links).

**Setup:** backend running (`npm run dev`), DB seeded (`npx prisma db seed`),
front-end running (`npm run dev`). Seeded accounts, password `password123`:
`admin@primo.fr` (admin), `boss@acme.fr` (owner), `manager@acme.fr` (manager),
`jean.dupont@acme.fr` (employee).

**How to use:** run each case, fill Result (Pass/Fail) + date. Use browser
DevTools (Network tab) to confirm the API call status behind each action.

**Last run:** 2026-07-03 - **31/31 Pass ✅** (manual browser QA, Mario).

---

## 1. Auth & onboarding

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 1.1 | Register a new account | Success message "check your email"; no auto-login |✅|
| 1.2 | Try to log in before verifying | Blocked, "email not verified" message |✅|
| 1.3 | Click the verification link in the email, then log in | Login works, lands on dashboard |✅|
| 1.4 | Log in with wrong password | Clear error, stays on login page |✅|
| 1.5 | Refresh the page while logged in | Session persists (no kick to login) |✅|
| 1.6 | Log out | Redirected to login; protected pages no longer reachable |✅|

## 2. Company lifecycle

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 2.1 | As a fresh verified user, create a company | Company created, shown as PENDING |✅|
| 2.2 | Try to buy tokens while PENDING | Blocked with a clear "not yet approved" message |✅|
| 2.3 | As admin, approve the company | Status flips to APPROVED |✅|
| 2.4 | Back as owner, buy tokens (Stripe checkout) | Redirects to Stripe, returns, balance updates |✅|

## 3. Invites & roles

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 3.1 | As owner, generate an EMPLOYEE invite code | Code shown |✅|
| 3.2 | New verified user joins with the code | Joins company as employee |✅|
| 3.3 | Try to join a second time | Blocked, "already in a company" |✅|

## 4. Token flow (money path)

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 4.1 | As owner, allocate tokens to a manager | Company pool decreases by that amount |✅|
| 4.2 | As manager, distribute the envelope to employees | Must total the envelope exactly, or it's rejected |✅|
| 4.3 | Try to distribute the same envelope twice | Blocked, "already distributed" |✅|
| 4.4 | As employee, check received history | The distributed tokens appear |✅|

## 5. Employee spend

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 5.1 | As employee, redeem an offer | Promo code returned, balance drops |✅|
| 5.2 | Redeem an offer costing more than balance | Blocked, insufficient balance |✅|
| 5.3 | Mark a redeemed code as used | Status updates in the spent history |✅|

## 6. Profile & GDPR

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 6.1 | Open profile, update name/avatar | Change saves and shows |✅|
| 6.2 | Export my data | JSON file downloads with profile + history (regression: BUG-5) |✅|
| 6.3 | Delete account with wrong password | Blocked |✅|
| 6.4 | Delete account with correct password | Account anonymized, logged out |✅|

## 7. Admin dashboard

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 7.1 | Open admin dashboard | Stats, users, companies load |✅|
| 7.2 | Promote/revert a user's role | Change persists after refresh |✅|
| 7.3 | Soft-delete then restore a company | Company disappears then comes back |✅|
| 7.4 | Open a category/offer with a bad URL id | Clean error, no crash (regression: BUG-6) |✅|

## 8. Cross-cutting UI checks

| # | Steps | Expected | Result |
|---|-------|----------|--------|
| 8.1 | Visit a protected route while logged out | Redirected to login |✅|
| 8.2 | Resize to mobile width on key screens | Layout holds, nothing cut off |✅|
| 8.3 | Watch DevTools Console during a full journey | No red errors |✅|

---

**Coverage note:** backend contracts for all these paths are proven by the
automated suites (see [test_result.md](test_result.md)). This plan covers the
browser/UI layer on top - rendering, navigation, and real external redirects
(Stripe, email) that can't run in the backend test harness.
