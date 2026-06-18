import { config } from '../config';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Envoi d'un email transactionnel via Brevo.
// Mode dev : sans BREVO_API_KEY, on logge au lieu d'envoyer → tout le
// flow est testable sans compte Brevo.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!config.BREVO_API_KEY) {
    console.log(`[mail:dev] BREVO_API_KEY absente → email NON envoyé à ${to}`);
    console.log(`[mail:dev] sujet : ${subject}`);
    console.log(`[mail:dev] contenu :\n${html}`);
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': config.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: config.BREVO_SENDER_EMAIL, name: config.BREVO_SENDER_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`BREVO_SEND_FAILED: ${res.status} ${body}`);
  }
}

// Construit + envoie l'email de vérification. Le lien pointe vers le
// backend (consommation one-time côté serveur), qui redirige ensuite
// vers le front.
export async function sendVerificationEmail(to: string, rawToken: string): Promise<void> {
  const link = `${config.API_URL}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  const html = `
    <p>Bienvenue sur Prim'O !</p>
    <p>Confirme ton adresse email en cliquant sur ce lien :</p>
    <p><a href="${link}">Vérifier mon adresse email</a></p>
    <p>Ce lien expire dans 24 heures.</p>
  `;
  await sendEmail({ to, subject: "Vérifie ton adresse email — Prim'O", html });
}
