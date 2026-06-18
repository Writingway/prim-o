# Résumé global pour validation — Porteurs de projet

**Date :** 2026-06-17
**Objet :** vue d'ensemble de **tous les comportements** de l'application — ce qu'on garde et ce qu'on change — pour que vous validiez le tout.

Langage simple, sans technique. Pour chaque point : « oui c'est ça » ou « non, plutôt comme ça ». Les points marqués 🆕 sont des **nouveaux choix** ; les autres existent déjà et on les **garde**. Les points marqués ❓ ont besoin de votre décision. Checklist à la fin.

---

## 1. Les rôles (qui fait quoi)

- **Administrateur de la plateforme** — vous / votre équipe. Valide les entreprises, gère le catalogue d'offres, surveille l'activité.
- **Responsable d'entreprise** — la personne qui crée l'entreprise. Achète des crédits, invite et gère ses employés, distribue les crédits.
- **Manager** — peut distribuer des crédits et gérer les employés (selon ce que le responsable délègue).
- **Employé** — reçoit des crédits, les dépense.

❓ À confirmer : la distinction **Responsable** vs **Manager** est-elle nécessaire, ou un seul niveau « gestionnaire » suffit ?

---

## 2. Inscription et arrivée 🆕

Comme les applications pro modernes (Slack, Notion) : le compte d'abord, l'entreprise ensuite.

1. Je crée mon compte (ou je me connecte).
2. Si je ne suis rattaché à aucune entreprise, on me propose **deux choix** :
   - **Créer une entreprise** → je deviens responsable.
   - **Rejoindre une entreprise** → j'entre un code d'invitation et je rejoins l'équipe.

🆕 **Le responsable n'est plus jamais bloqué à l'entrée de son compte** (c'était un défaut aujourd'hui).

---

## 3. États d'une entreprise 🆕

Une entreprise créée n'est pas active tout de suite : elle attend la validation d'un administrateur de la plateforme.

| État | Ce que le responsable peut faire |
|---|---|
| **En attente** | Se connecter, voir son tableau de bord (bandeau « en cours de validation »), modifier ses infos. **Bloqué** : acheter des crédits, inviter des employés, distribuer des crédits. |
| **Validée** | Tout débloqué. |
| **Refusée** | Accès bloqué, message clair. |

❓ Qui sont les administrateurs qui valident ? Délai cible de validation ?

---

## 4. Faire entrer des employés (codes d'invitation)

Le responsable génère un **code d'invitation** (durée limitée, nombre d'usages limité). L'employé entre ce code pour rejoindre.

🆕 **Le code suffit** : avant, l'employé devait *encore* être validé manuellement après le code. On supprime cette étape en double — le code valant déjà autorisation, l'employé est **actif directement**.

On garde la possibilité de **retirer** un employé qui quitte l'entreprise.

---

## 5. Les crédits (cœur du produit) — comportements gardés

- **L'entreprise achète des crédits** par paiement en ligne (carte). Ces crédits alimentent une **réserve commune** de l'entreprise.
- **Le responsable/manager distribue** des crédits depuis cette réserve vers le **portefeuille d'un employé**.
- **L'employé** voit son solde, ce qu'il a **reçu** et ce qu'il a **dépensé**.
- Garde-fous gardés : on ne peut pas distribuer plus que la réserve disponible ; une entreprise non validée ne peut ni acheter ni distribuer.

❓ **L'employé dépense ses crédits sur des offres** : prévu dans le modèle, mais **pas encore construit** (l'employé ne peut pas encore « consommer » une offre). À décider ensemble.

**Notre proposition (choix senior) pour une première version :**
- L'employé choisit une offre, ses crédits sont **débités immédiatement** de son portefeuille, et il reçoit un **bon / code à usage unique** (à présenter chez le partenaire). C'est le modèle des plateformes d'avantages : simple, en libre-service, sans dépendance externe à brancher tout de suite.
- Chaque dépense est **enregistrée** (qui, quoi, quand, combien) — traçabilité complète, déjà prévue.
- Garde-fous : on ne peut pas dépenser plus que son solde ; pas de double-débit si l'employé clique deux fois.
- Pour que ça marche, chaque offre doit avoir un **coût en crédits** clairement défini (à ajouter si absent).
- On **reporte à plus tard** (pas maintenant) : intégrations partenaires automatiques, conversion en cartes cadeaux externes, livraison physique. On le fera si le besoin est confirmé.

❓ Ce modèle « bon / code à usage unique » vous convient pour démarrer, ou vous visez direct une intégration partenaire ?

---

## 6. Le catalogue d'offres — comportements gardés

- Un catalogue d'**offres** classées par catégories : **Alimentation, Shopping, Culture, Voyage, Bien-être, Autre**.
- Les offres sont **consultables** (y compris, semble-t-il, sans être connecté).
- L'**administrateur** crée, modifie et désactive les offres.

❓ Le catalogue est-il **commun à toutes les entreprises**, ou chaque entreprise a-t-elle le sien ?

---

## 7. Côté administrateur de la plateforme — comportements gardés

- **Valider / refuser** les entreprises.
- **Gérer le catalogue** d'offres.
- **Gérer les utilisateurs** (consulter, modifier, désactiver).
- **Désactiver puis restaurer** une entreprise (sans perte de données).
- **Tableau de bord** : statistiques, historique des distributions, des dépenses, des achats de crédits.

---

## 8. Navigation dans l'application 🆕

Aujourd'hui la navigation est bricolée : les liens ne correspondent pas aux écrans. Résultat : pas de lien partageable, bouton retour cassé, rafraîchir ramène au début, retour de paiement fragile.

🆕 On passe à un outil de navigation moderne standard → liens partageables, bouton retour qui marche, rafraîchissement sans perte, retour de paiement fiable.

---

## 9. Nettoyage technique (sans impact visible négatif)

On corrige au passage des choix anciens risqués (messages d'erreur incohérents, vérification d'email contournée, étapes en double). Effet pour vous : messages plus clairs, moins de bugs. Détail réservé à l'équipe technique.

---

## ✅ À valider

**Nouveaux choix :**
1. Compte d'abord, entreprise ensuite (créer OU rejoindre) — OK ?
2. Responsable toujours capable de se connecter, usage avancé bloqué tant que l'entreprise n'est pas validée — OK ?
3. Entreprise nouvellement créée → validation par un administrateur — OK ?
4. Code d'invitation suffisant (plus de validation manuelle en double) — OK ?
5. Navigation modernisée — OK ?

**Questions de cadrage (❓) :**

6. Rôles : garder Responsable **et** Manager, ou un seul niveau ?
7. Qui valide les entreprises, et en combien de temps ?
8. La dépense de crédits par l'employé : attendue **maintenant** ou plus tard ? Et le modèle « bon / code à usage unique » (notre reco, section 5) convient-il pour démarrer ?
9. Catalogue d'offres commun à tous, ou propre à chaque entreprise ?

Toute réponse « non » / « ça dépend » nous évite de construire la mauvaise chose.
