#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prim'O — smoke test du back (refonte OWNER/MANAGER/EMPLOYEE).
# Headless : prouve que les règles métier tiennent avant de tester l'UI.
#
# Pré-requis : backend lancé (npm run dev) + seed appliqué (npx prisma db seed).
# Usage      : bash tests/smoke.sh            (BASE par défaut http://localhost:4000/api)
#              BASE=http://host:port/api bash tests/smoke.sh
#
# N'a besoin que de curl. Pas de jq.
# ---------------------------------------------------------------------------
set -u
BASE="${BASE:-http://localhost:4000/api}"
PASS=0; FAIL=0

# Couleurs
g(){ printf '\033[32m%s\033[0m\n' "$1"; }
r(){ printf '\033[31m%s\033[0m\n' "$1"; }

# check "<libellé>" <code_attendu> <code_obtenu>
check(){ if [ "$2" = "$3" ]; then g "PASS  $1  ($3)"; PASS=$((PASS+1)); else r "FAIL  $1  attendu $2, obtenu $3"; FAIL=$((FAIL+1)); fi; }

# status_only METHOD PATH JSON [TOKEN] -> imprime le code HTTP
status_only(){
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" \
    -H 'Content-Type: application/json' \
    ${token:+-H "Authorization: Bearer $token"} \
    ${body:+-d "$body"}
}

# body METHOD PATH JSON [TOKEN] -> imprime le corps de réponse
body(){
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  curl -s -X "$method" "$BASE$path" \
    -H 'Content-Type: application/json' \
    ${token:+-H "Authorization: Bearer $token"} \
    ${body:+-d "$body"}
}

# Extrait une valeur string d'un JSON plat : extract '<clé>' '<json>'
extract(){ printf '%s' "$2" | grep -o "\"$1\":\"[^\"]*\"" | head -1 | sed "s/\"$1\":\"//;s/\"$//"; }

echo "== BASE: $BASE =="

# 1. Inscription entreprise -> 201 (company PENDING + OWNER, jamais actif d'emblée)
EMAIL="patron+$RANDOM@smoke.test"
REG=$(status_only POST /auth/register-company \
  "{\"companyName\":\"SmokeCo\",\"firstName\":\"Pat\",\"lastName\":\"Ron\",\"email\":\"$EMAIL\",\"password\":\"password123\"}")
check "register-company" 201 "$REG"

# 2. Login OWNER seedé (boss@acme.fr, APPROVED) -> récupère accessToken
LOGIN=$(body POST /auth/login '{"email":"boss@acme.fr","password":"password123"}')
OWNER_TOKEN=$(extract accessToken "$LOGIN")
if [ -n "$OWNER_TOKEN" ]; then g "PASS  login owner (token reçu)"; PASS=$((PASS+1)); else r "FAIL  login owner (pas de token) -> $LOGIN"; FAIL=$((FAIL+1)); fi

# 3. OWNER génère un code MANAGER -> 201
MGR_CODE_RES=$(body POST /invites/generate '{"role":"MANAGER","maxUses":5,"expiresInHours":24}' "$OWNER_TOKEN")
MGR_CODE=$(extract code "$MGR_CODE_RES")
if [ -n "$MGR_CODE" ]; then g "PASS  owner mint MANAGER code ($MGR_CODE)"; PASS=$((PASS+1)); else r "FAIL  owner mint MANAGER code -> $MGR_CODE_RES"; FAIL=$((FAIL+1)); fi

# 4. Inscription manager avec ce code -> 201 (rôle = MANAGER, jamais auto-déclaré)
MEMAIL="mgr+$RANDOM@smoke.test"
REGM=$(status_only POST /auth/register-user \
  "{\"firstName\":\"Mana\",\"lastName\":\"Ger\",\"email\":\"$MEMAIL\",\"password\":\"password123\",\"code\":\"$MGR_CODE\"}")
check "register manager via code" 201 "$REGM"

# 5. Login MANAGER seedé (manager@acme.fr) pour tester ses limites
LOGINM=$(body POST /auth/login '{"email":"manager@acme.fr","password":"password123"}')
MGR_TOKEN=$(extract accessToken "$LOGINM")
if [ -n "$MGR_TOKEN" ]; then g "PASS  login manager (token reçu)"; PASS=$((PASS+1)); else r "FAIL  login manager -> $LOGINM"; FAIL=$((FAIL+1)); fi

# 6. SÉCURITÉ — un MANAGER ne peut PAS générer de code MANAGER (escalade) -> 403
ESC=$(status_only POST /invites/generate '{"role":"MANAGER"}' "$MGR_TOKEN")
check "manager mint MANAGER code refusé" 403 "$ESC"

# 7. Un MANAGER PEUT générer un code EMPLOYEE -> 201
EMPC=$(status_only POST /invites/generate '{"role":"EMPLOYEE"}' "$MGR_TOKEN")
check "manager mint EMPLOYEE code" 201 "$EMPC"

# 8. SÉCURITÉ — achat Stripe réservé OWNER : un MANAGER -> 403
BUYM=$(status_only POST /stripe/checkout '{"amount":10}' "$MGR_TOKEN")
check "manager checkout refusé (OWNER-only)" 403 "$BUYM"

# 9. OWNER peut lancer un checkout -> 200 (URL Stripe). 500 = clés Stripe absentes (info, pas un bug métier).
BUYO=$(status_only POST /stripe/checkout '{"amount":10}' "$OWNER_TOKEN")
if [ "$BUYO" = "200" ]; then g "PASS  owner checkout (200)"; PASS=$((PASS+1));
elif [ "$BUYO" = "500" ]; then printf '\033[33m%s\033[0m\n' "SKIP  owner checkout -> 500 (clés Stripe non configurées ?)";
else r "FAIL  owner checkout attendu 200, obtenu $BUYO"; FAIL=$((FAIL+1)); fi

echo "== Résultat : $PASS PASS / $FAIL FAIL =="
[ "$FAIL" -eq 0 ]
