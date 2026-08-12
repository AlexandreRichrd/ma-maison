import nodemailer from "nodemailer";

const FROM = process.env.MAIL_FROM ?? "Hearth <no-reply@hearth.local>";

// SMTP is optional in development — without it, emails are logged instead
// of sent, so the invite/activate flow can be exercised locally without
// real mail infrastructure. Required in production (see .env.example).
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!transporter) {
    console.log(`[mail] SMTP not configured — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, text });
}

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:5173";
  return new URL(path, base).toString();
}

export async function sendInviteEmail(email: string, token: string): Promise<void> {
  const link = appUrl(`/register?token=${token}`);
  await sendMail(
    email,
    "Invitation à rejoindre Hearth",
    `Tu as été invité·e à rejoindre le foyer sur Hearth.\n\nCrée ton compte ici : ${link}\n\nCe lien expire dans 7 jours.`,
  );
}

export async function sendActivationEmail(email: string, token: string): Promise<void> {
  const link = appUrl(`/activate?token=${token}`);
  await sendMail(
    email,
    "Active ton compte Hearth",
    `Bienvenue sur Hearth ! Active ton compte pour pouvoir te connecter :\n\n${link}\n\nCe lien expire dans 24 heures.`,
  );
}
