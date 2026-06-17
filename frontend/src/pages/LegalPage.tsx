import './legal.css';

export type LegalPageKey = 'privacy' | 'mentions' | 'cgu';

type LegalPageProps = {
  page: LegalPageKey;
  onBack: () => void;
};

// Marqueur réutilisable pour les infos officielles à fournir.
const Todo = ({ children }: { children: React.ReactNode }) => (
  <span className="legal-todo">[À COMPLÉTER : {children}]</span>
);

function PrivacyPolicy() {
  return (
    <>
      <h1 className="legal-title">Politique de confidentialité</h1>
      <p className="legal-updated">Dernière mise à jour : <Todo>date</Todo></p>

      <h2>1. Qui est responsable de vos données ?</h2>
      <p>
        La plateforme Prim'O est éditée par <Todo>raison sociale</Todo>,
        <Todo>forme juridique et capital</Todo>, immatriculée sous le numéro
        <Todo>SIRET</Todo>, dont le siège est situé <Todo>adresse</Todo>.
        Pour toute question relative à vos données, contactez <Todo>email de contact RGPD / DPO</Todo>.
      </p>

      <h2>2. Quelles données collectons-nous ?</h2>
      <p>Dans le cadre de votre utilisation de Prim'O, nous traitons :</p>
      <ul>
        <li>vos données d'identification : nom, prénom, adresse email ;</li>
        <li>votre mot de passe, stocké de façon sécurisée (haché, jamais en clair) ;</li>
        <li>votre entreprise de rattachement ;</li>
        <li>vos données d'usage : récompenses reçues, dépenses, historique des transactions.</li>
      </ul>

      <h2>3. Pourquoi (finalités) et sur quelle base légale ?</h2>
      <ul>
        <li>Gérer votre compte et vous fournir le service — base : exécution du contrat (CGU) ;</li>
        <li>Attribuer et utiliser les récompenses — base : exécution du contrat ;</li>
        <li>Assurer la sécurité et prévenir les abus — base : intérêt légitime ;</li>
        <li>Respecter nos obligations comptables et légales — base : obligation légale.</li>
      </ul>

      <h2>4. Qui peut accéder à vos données ?</h2>
      <p>
        Vos données sont accessibles à votre employeur (via son espace manager), à nos
        prestataires techniques (hébergement : <Todo>hébergeur</Todo>) et, le cas échéant,
        aux partenaires fournissant les offres que vous utilisez. Nous ne vendons jamais
        vos données.
      </p>

      <h2>5. Combien de temps conservons-nous vos données ?</h2>
      <p>
        Vos données de compte sont conservées tant que votre compte est actif. Un compte
        resté inactif pendant 3 ans est anonymisé. À la suppression de votre compte, vos
        données identifiantes sont également anonymisées. Les écritures liées aux récompenses
        sont conservées de façon anonymisée pour répondre à nos obligations comptables
        (jusqu'à 10 ans).
      </p>


      <h2>6. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits d'accès, de rectification,
        d'effacement, de portabilité, d'opposition et de limitation. Vous pouvez exercer
        l'accès, la rectification, la portabilité et l'effacement directement depuis votre
        espace (section « Mon profil » et « Mes données personnelles »), ou en nous
        contactant à <Todo>email de contact RGPD</Todo>. Vous pouvez aussi introduire une
        réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Prim'O utilise uniquement un cookie strictement nécessaire à votre authentification
        (maintien de session sécurisée). Ce cookie ne requiert pas votre consentement. Nous
        n'utilisons aucun cookie de mesure d'audience ou de publicité.
      </p>

      <h2>8. Transferts hors Union européenne</h2>
      <p><Todo>préciser : aucun transfert hors UE, ou les garanties applicables</Todo></p>
    </>
  );
}

function LegalNotice() {
  return (
    <>
      <h1 className="legal-title">Mentions légales</h1>
      <p className="legal-updated">Dernière mise à jour : <Todo>date</Todo></p>

      <h2>Éditeur du site</h2>
      <p>
        Le site Prim'O est édité par <Todo>raison sociale</Todo>,
        <Todo>forme juridique</Todo> au capital de <Todo>montant</Todo> €,
        immatriculée au RCS de <Todo>ville</Todo> sous le numéro <Todo>SIRET</Todo>.
      </p>
      <ul>
        <li>Siège social : <Todo>adresse complète</Todo></li>
        <li>Email : <Todo>email de contact</Todo></li>
        <li>Téléphone : <Todo>numéro</Todo></li>
        <li>Directeur de la publication : <Todo>nom</Todo></li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <Todo>nom de l'hébergeur</Todo>,
        <Todo>adresse de l'hébergeur</Todo>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur Prim'O (marque, logo, textes, interface)
        est protégé par le droit de la propriété intellectuelle et reste la propriété
        exclusive de l'éditeur, sauf mention contraire. Toute reproduction sans
        autorisation est interdite.
      </p>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <h1 className="legal-title">Conditions générales d'utilisation</h1>
      <p className="legal-updated">Dernière mise à jour : <Todo>date</Todo></p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et
        l'usage de la plateforme Prim'O, qui permet à des entreprises de récompenser
        leurs employés au moyen de tokens échangeables contre des offres partenaires.
      </p>

      <h2>2. Compte et accès</h2>
      <p>
        L'accès au service nécessite la création d'un compte. L'employé s'inscrit à l'aide
        d'un code d'invitation fourni par son entreprise, et son compte peut être soumis à
        validation par un manager. Vous êtes responsable de la confidentialité de vos
        identifiants.
      </p>

      <h2>3. Fonctionnement des récompenses</h2>
      <p>
        Les managers attribuent des tokens aux employés depuis le pool de leur entreprise.
        Les employés peuvent échanger leurs tokens contre des offres partenaires. Les
        tokens n'ont pas de valeur monétaire et ne sont ni convertibles en argent ni
        cessibles entre utilisateurs.
      </p>

      <h2>4. Obligations de l'utilisateur</h2>
      <p>
        Vous vous engagez à utiliser le service de bonne foi, à ne pas tenter d'en
        compromettre la sécurité et à fournir des informations exactes.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        L'éditeur s'efforce d'assurer la disponibilité et la sécurité du service, sans
        garantie d'absence d'interruption. Sa responsabilité ne saurait être engagée en cas
        de mauvaise utilisation du service par l'utilisateur. <Todo>clauses spécifiques à valider</Todo>
      </p>

      <h2>6. Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est décrit dans notre Politique de
        confidentialité, que nous vous invitons à consulter.
      </p>

      <h2>7. Modification et droit applicable</h2>
      <p>
        L'éditeur peut faire évoluer les présentes CGU. Elles sont soumises au droit
        <Todo>pays applicable, ex. français</Todo>. Tout litige relève des tribunaux
        compétents de <Todo>ressort</Todo>.
      </p>
    </>
  );
}

export default function LegalPage({ page, onBack }: LegalPageProps) {
  return (
    <div className="legal-wrapper">
      <div className="legal-card">
        <button className="legal-back" type="button" onClick={onBack}>
          ← Retour
        </button>
        {page === 'privacy' && <PrivacyPolicy />}
        {page === 'mentions' && <LegalNotice />}
        {page === 'cgu' && <TermsOfService />}
      </div>
    </div>
  );
}
