import 'dotenv/config';
import app from './app';
import { config } from './config';
import { startTokenCleanup } from './jobs/tokenCleanup';
import { startInactiveAccountCleanup } from './jobs/inactiveAccountCleanup';

// Point d'entrée runtime uniquement : écoute + jobs de fond.
// La construction de l'app (middlewares, routes) vit dans app.ts,
// importable par les tests d'intégration sans ouvrir de port.
app.listen(config.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${config.PORT}`);
});

// Démarre le job de nettoyage des tokens révoqués (tous les 24 heures).
startTokenCleanup();

// Démarre le job d'anonymisation RGPD des comptes inactifs (toutes les 24h).
startInactiveAccountCleanup();
