# Registre des activités de traitement — Prim'O

> Registre tenu au titre de l'article 30 du RGPD. Il recense les traitements de
> données personnelles mis en œuvre par Prim'O en tant que responsable de traitement.
> Dernière mise à jour : [À COMPLÉTER : date].

## Responsable du traitement

- Organisme : [À COMPLÉTER : raison sociale]
- Coordonnées : [À COMPLÉTER : adresse, email]
- Contact RGPD / DPO : [À COMPLÉTER : email de contact]

---

## Traitement n°1 — Gestion des comptes utilisateurs

| Élément | Détail |
|---|---|
| Finalité | Créer et gérer les comptes des utilisateurs (managers et employés) |
| Base légale | Exécution du contrat (CGU) |
| Personnes concernées | Managers et employés des entreprises clientes |
| Catégories de données | Nom, prénom, email, entreprise de rattachement, rôle, statut |
| Destinataires | L'entreprise employeur (espace manager), l'hébergeur |
| Durée de conservation | Durée de vie du compte ; anonymisation à la suppression, ou après 3 ans d'inactivité |
| Mesures de sécurité | Authentification JWT, cloisonnement par entreprise (multi-tenant), anonymisation à la suppression |

## Traitement n°2 — Authentification et sécurité

| Élément | Détail |
|---|---|
| Finalité | Authentifier les utilisateurs et sécuriser les sessions |
| Base légale | Exécution du contrat + intérêt légitime (sécurité du service) |
| Personnes concernées | Tous les utilisateurs |
| Catégories de données | Mot de passe haché, refresh tokens hachés, tokens de vérification d'email |
| Destinataires | Interne, hébergeur |
| Durée de conservation | Tokens supprimés à expiration/révocation (job de nettoyage quotidien) ; suppression à la clôture du compte |
| Mesures de sécurité | Bcrypt (coût 12), cookies httpOnly, hachage SHA-256 des tokens, rate limiting, en-têtes Helmet |

## Traitement n°3 — Attribution et utilisation des récompenses

| Élément | Détail |
|---|---|
| Finalité | Distribuer des tokens aux employés et permettre leur échange contre des offres |
| Base légale | Exécution du contrat ; obligation légale (comptabilité) |
| Personnes concernées | Employés, managers |
| Catégories de données | Montants, motifs d'attribution, historique des attributions et dépenses, codes promo |
| Destinataires | L'entreprise, les partenaires des offres (codes), l'hébergeur |
| Durée de conservation | Registre comptable conservé sous forme anonymisée jusqu'à 10 ans (obligation comptable, art. L123-22 du Code de commerce) |
| Mesures de sécurité | Registre en ajout seul (append-only), transactions atomiques, contraintes en base |

## Traitement n°4 — Gestion des entreprises clientes

| Élément | Détail |
|---|---|
| Finalité | Gérer les entreprises clientes, leur pool de tokens et les recharges |
| Base légale | Exécution du contrat ; obligation légale (comptabilité) |
| Personnes concernées | Représentants et managers des entreprises |
| Catégories de données | Nom de l'entreprise, solde du pool, historique des recharges |
| Destinataires | Interne, hébergeur |
| Durée de conservation | Durée de la relation contractuelle + obligations comptables (~10 ans) |
| Mesures de sécurité | Accès réservé aux rôles autorisés (admin/manager) |

---

## Synthèse des durées de conservation (article 5)

| Donnée | Durée |
|---|---|
| Compte actif | Tant que le compte existe |
| Compte supprimé | Anonymisation immédiate des données identifiantes |
| Compte inactif | Anonymisation après 3 ans d'inactivité (job automatique à implémenter) |
| Refresh / tokens email | Jusqu'à expiration ou révocation (nettoyage quotidien) |
| Écritures de récompenses (anonymisées) | Jusqu'à 10 ans (obligation comptable) |

## Sous-traitants

| Sous-traitant | Rôle | Garanties |
|---|---|---|
| [À COMPLÉTER : hébergeur] | Hébergement des données | [À COMPLÉTER : localisation UE, contrat / DPA] |
| Brevo (prévu) | Envoi des emails transactionnels | À encadrer par un accord de sous-traitance lors de l'intégration |

## Transferts hors Union européenne

[À COMPLÉTER : aucun transfert hors UE, ou préciser les garanties applicables.]
