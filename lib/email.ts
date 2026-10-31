import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { formatFcfa } from "./format";

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ?? "",
      },
    });
  }
  return transport;
}

function escapeHtml(valeur: string): string {
  return valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface InfosCommandeEmail {
  reference: string;
  oeuvreTitre: string;
  oeuvreType: string;
  prixFcfa: number;
  artisteNom: string;
  clientNom: string;
  clientEmail: string;
  telephone: string;
  ville: string;
  adresse: string | null;
  message: string | null;
}

export function destinatairesArtova(): string {
  return process.env.ORDER_EMAIL || "artovacorp@gmail.com";
}

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

// Railway bloque le SMTP sortant (ports 25/465/587) : en production l'envoi
// passe par l'API HTTPS de Resend. Le SMTP reste disponible en local.
export async function envoyerEmail(email: Email): Promise<boolean> {
  const destinataires = email.to.split(",").map((a) => a.trim()).filter(Boolean);

  if (process.env.RESEND_API_KEY) {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ArTova <onboarding@resend.dev>",
        to: destinataires,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!reponse.ok) {
      throw new Error(`Resend ${reponse.status} : ${await reponse.text()}`);
    }
    return true;
  }

  const t = getTransport();
  if (!t) {
    console.log(
      `[ArTova] Envoi d'email non configuré (RESEND_API_KEY absente), email journalisé :\n À : ${email.to}\n Objet : ${email.subject}\n${email.text}`,
    );
    return false;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM ?? '"ArTova" <contact@artova.tg>',
    to: destinataires,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: email.replyTo,
  });
  return true;
}

export async function sendCommandeEmail(
  infos: InfosCommandeEmail,
): Promise<boolean> {
  const destinataire = destinatairesArtova();
  const sujet = `[ArTova] Commande ${infos.reference} : « ${infos.oeuvreTitre} »`;

  const texte = [
    `Nouvelle commande ArTova : ${infos.reference}`,
    "",
    `Œuvre commandée : ${infos.oeuvreTitre} (${infos.oeuvreType})`,
    `Artiste : ${infos.artisteNom}`,
    `Prix : ${formatFcfa(infos.prixFcfa)}`,
    "",
    "Client :",
    `  Nom : ${infos.clientNom}`,
    `  Email : ${infos.clientEmail}`,
    `  Téléphone : ${infos.telephone}`,
    `  Ville : ${infos.ville}`,
    infos.adresse ? `  Adresse : ${infos.adresse}` : "",
    infos.message ? `  Message : ${infos.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Georgia,serif;color:#241D18;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:26px;letter-spacing:2px">ArTova</h1>
      <p style="font-size:15px">Nouvelle commande <strong>${escapeHtml(infos.reference)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px" cellpadding="6">
        <tr><td style="border:1px solid #E7E1D5"><strong>Œuvre</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.oeuvreTitre)} (${escapeHtml(infos.oeuvreType)})</td></tr>
        <tr><td style="border:1px solid #E7E1D5"><strong>Artiste</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.artisteNom)}</td></tr>
        <tr><td style="border:1px solid #E7E1D5"><strong>Prix</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(formatFcfa(infos.prixFcfa))}</td></tr>
        <tr><td style="border:1px solid #E7E1D5"><strong>Client</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.clientNom)} (${escapeHtml(infos.clientEmail)})</td></tr>
        <tr><td style="border:1px solid #E7E1D5"><strong>Téléphone</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.telephone)}</td></tr>
        <tr><td style="border:1px solid #E7E1D5"><strong>Ville</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.ville)}</td></tr>
        ${infos.adresse ? `<tr><td style="border:1px solid #E7E1D5"><strong>Adresse</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.adresse)}</td></tr>` : ""}
        ${infos.message ? `<tr><td style="border:1px solid #E7E1D5"><strong>Message</strong></td><td style="border:1px solid #E7E1D5">${escapeHtml(infos.message)}</td></tr>` : ""}
      </table>
      <p style="font-size:12px;color:#8A8378">Message généré automatiquement par la plateforme ArTova.</p>
    </div>`;

  return envoyerEmail({
    to: destinataire,
    subject: sujet,
    text: texte,
    html,
    replyTo: infos.clientEmail,
  });
}

export async function sendNouvelArtisteEmail(infos: {
  nom: string;
  discipline: string;
  ville: string | null;
  email: string;
  telephone: string;
}): Promise<boolean> {
  const site = process.env.SITE_URL ?? "";
  const lignes = [
    `Nouvelle page d'artiste à valider : ${infos.nom}`,
    "",
    `Discipline : ${infos.discipline}`,
    `Ville : ${infos.ville ?? "non précisée"}`,
    `Email : ${infos.email}`,
    `Téléphone : ${infos.telephone}`,
    "",
    `Valider la page : ${site}/admin/artistes`,
  ];
  return envoyerEmail({
    to: destinatairesArtova(),
    subject: `[ArTova] Nouvelle page d'artiste à valider : ${infos.nom}`,
    text: lignes.join("\n"),
    html: `<div style="font-family:Georgia,serif;color:#241D18;max-width:560px;margin:0 auto;padding:24px">
      <h1 style="font-size:26px;letter-spacing:2px">ArTova</h1>
      <p style="font-size:15px">Nouvelle page d'artiste à valider : <strong>${escapeHtml(infos.nom)}</strong></p>
      <p style="font-size:14px;line-height:1.6">${escapeHtml(infos.discipline)} · ${escapeHtml(infos.ville ?? "Togo")}<br>${escapeHtml(infos.email)} · ${escapeHtml(infos.telephone)}</p>
      <p><a href="${escapeHtml(site)}/admin/artistes" style="display:inline-block;background:#1b1a17;color:#fbfaf4;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px">EXAMINER LA PAGE</a></p>
    </div>`,
  });
}
