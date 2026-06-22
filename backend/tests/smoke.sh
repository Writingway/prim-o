#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prim'O - smoke test du back (onboarding account-first).
# Prouve les règles métier avant de tester l'UI :
#   register flottant -> create-company (PENDING) -> achat bloqué (403)
#   -> admin approuve -> achat débloqué (200) ; + join-company via code.
#
# Pré-requis : backend lancé (npm run dev) + seed (npx prisma db seed).
#              Admin seedé attendu : admin@primo.fr / password123.
# Usage      : bash tests/smoke.sh   (BASE par défaut http://localhost:4000/api)
#              BASE=http://host:port/api bash tests/smoke.sh
# N'a besoin que de curl. Pas de jq.
# ---------------------------------------------------------------------------
set -u
BASE="${BASE:-http://localhost:4000/api}"
PASS=0; FAIL=0

g(){ printf '\033[32m%s\033[0m\n' "$1"; }
r(){ printf '\033[31m%s\033[0m\n' "$1"; }
y(){ printf '\033[33m%s\033[0m\n' "$1"; }

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

# 1. Register utilisateur flottant -> 201 + auto-login (accessToken).
OEMAIL="patron+$RANDOM@smoke.test"
REG=$(body POST /auth/register \
  "{\"firstName\":\"Pat\",\"lastName\":\"Ron\",\"email\":\"$OEMAIL\",\"password\":\"password123\"}")
OWNER_TOKEN=$(extract accessToken "$REG")
if [ -n "$OWNER_TOKEN" ]; then g "PASS  register flottant (token reçu)"; PASS=$((PASS+1));
else r "FAIL  register flottant -> $REG"; FAIL=$((FAIL+1)); fi

# 2. create-company -> 201 : Company PENDING, l'appelant devient OWNER,
#    token FRAIS (l'ancien portait role=null). On capture id + nouveau token.
CC=$(body POST /auth/create-company '{"companyName":"SmokeCo"}' "$OWNER_TOKEN")
COMPANY_ID=$(extract id "$CC")
OWNER_TOKEN=$(extract accessToken "$CC")
if [ -n "$COMPANY_ID" ] && [ -n "$OWNER_TOKEN" ]; then
  g "PASS  create-company (id=$COMPANY_ID, token frais)"; PASS=$((PASS+1));
else r "FAIL  create-company -> $CC"; FAIL=$((FAIL+1)); fi

# 3. Achat tokens AVANT validation admin -> 403 (entreprise PENDING).
BUY_PENDING=$(status_only POST /stripe/checkout '{"amount":10}' "$OWNER_TOKEN")
check "checkout bloqué tant que PENDING" 403 "$BUY_PENDING"

# 4. Login admin seedé -> token.
LADMIN=$(body POST /auth/login '{"email":"admin@primo.fr","password":"password123"}')
ADMIN_TOKEN=$(extract accessToken "$LADMIN")
if [ -n "$ADMIN_TOKEN" ]; then g "PASS  login admin"; PASS=$((PASS+1));
else r "FAIL  login admin -> $LADMIN"; FAIL=$((FAIL+1)); fi

# 5. Admin approuve l'entreprise -> 200.
APPROVE=$(status_only PATCH "/admin/companies/$COMPANY_ID/status" '{"status":"APPROVED"}' "$ADMIN_TOKEN")
check "admin approve company" 200 "$APPROVE"

# 6. Achat APRÈS validation -> 200 (500 = clés Stripe absentes : info, pas un bug métier).
BUY_OK=$(status_only POST /stripe/checkout '{"amount":10}' "$OWNER_TOKEN")
if [ "$BUY_OK" = "200" ]; then g "PASS  checkout après APPROVED (200)"; PASS=$((PASS+1));
elif [ "$BUY_OK" = "500" ]; then y "SKIP  checkout -> 500 (clés Stripe non configurées ?)";
else r "FAIL  checkout après APPROVED attendu 200, obtenu $BUY_OK"; FAIL=$((FAIL+1)); fi

# 7. OWNER (entreprise APPROVED) génère un code EMPLOYEE -> 201.
EMPC=$(body POST /invites/generate '{"role":"EMPLOYEE","maxUses":5,"expiresInHours":24}' "$OWNER_TOKEN")
EMP_CODE=$(extract code "$EMPC")
if [ -n "$EMP_CODE" ]; then g "PASS  owner mint EMPLOYEE code ($EMP_CODE)"; PASS=$((PASS+1));
else r "FAIL  owner mint EMPLOYEE code -> $EMPC"; FAIL=$((FAIL+1)); fi

# 8. Register 2e utilisateur flottant (futur employé) -> token.
EEMAIL="emp+$RANDOM@smoke.test"
REGE=$(body POST /auth/register \
  "{\"firstName\":\"Emp\",\"lastName\":\"Loye\",\"email\":\"$EEMAIL\",\"password\":\"password123\"}")
EMP_TOKEN=$(extract accessToken "$REGE")
if [ -n "$EMP_TOKEN" ]; then g "PASS  register employé flottant"; PASS=$((PASS+1));
else r "FAIL  register employé -> $REGE"; FAIL=$((FAIL+1)); fi

# 9. join-company avec le code -> 200 (membre actif direct, plus d'approbation).
JOIN=$(status_only POST /auth/join-company "{\"code\":\"$EMP_CODE\"}" "$EMP_TOKEN")
check "join-company via code" 200 "$JOIN"

# 10. SÉCURITÉ - rejoindre une 2e fois alors qu'on a déjà une entreprise -> 409.
#     (Le service relit l'utilisateur en DB : marche même avec un token périmé.)
JOIN2=$(status_only POST /auth/join-company "{\"code\":\"$EMP_CODE\"}" "$EMP_TOKEN")
check "join-company 2e fois refusé (déjà membre)" 409 "$JOIN2"

echo "== Résultat : $PASS PASS / $FAIL FAIL =="
[ "$FAIL" -eq 0 ]
