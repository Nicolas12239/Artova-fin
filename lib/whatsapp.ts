import { formatFcfa } from "./format";

// Numéro WhatsApp prévenu à chaque commande.
export function numeroWhatsapp(): string {
  return normaliserNumero(process.env.WHATSAPP_NUMBER || "+22896095435");
}

// Accepte « 96 09 54 35 », « 0022896095435 » ou « +228 96095435 ».
export function normaliserNumero(brut: string): string {
  const chiffres = brut.replace(/[^\d+]/g, "");
  if (!chiffres) return "";
  if (chiffres.startsWith("+")) return chiffres;
  if (chiffres.startsWith("00")) return `+${chiffres.slice(2)}`;
  if (chiffres.length === 8) return `+228${chiffres}`;
  return `+${chiffres}`;
}

export function formaterNumero(numero: string): string {
  return numero.replace(/^\+228(\d{2})(\d{2})(\d{2})(\d{2})$/, "+228 $1 $2 $3 $4");
}

// Envoi via CallMeBot (gratuit, usage personnel) : la clé est obtenue en
// envoyant « I allow callmebot to send me messages » au bot depuis WhatsApp.
export async function envoyerWhatsapp(texte: string): Promise<boolean> {
  const cle = process.env.CALLMEBOT_APIKEY;
  const numero = numeroWhatsapp();
  if (!cle) {
    console.log(
      `[ArTova] Notification WhatsApp non configurée (CALLMEBOT_APIKEY absente), message journalisé :\n À : ${numero}\n${texte}`,
    );
    return false;
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", numero);
  // CallMeBot supprime l'apostrophe droite : on envoie l'apostrophe typographique.
  url.searchParams.set("text", texte.replace(/'/g, "’"));
  url.searchParams.set("apikey", cle);
  const reponse = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const corps = await reponse.text();
  // CallMeBot répond 203 (ou 200 avec un message d'erreur) quand l'envoi échoue.
  if (reponse.status !== 200 || /invalid|error|not\s+(?:allowed|activated)/i.test(corps)) {
    const detail = corps.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(`CallMeBot ${reponse.status} : ${detail}`);
  }
  return true;
}

export async function sendCommandeWhatsapp(infos: {
  reference: string;
  oeuvreTitre: string;
  artisteNom: string;
  prixFcfa: number;
  clientNom: string;
  clientEmail: string;
  telephone: string;
  ville: string;
  adresse: string | null;
  message: string | null;
}): Promise<boolean> {
  const site = process.env.SITE_URL ?? "";
  const lignes = [
    "*Nouvelle commande ArTova*",
    `Réf. ${infos.reference}`,
    "",
    `Œuvre : « ${infos.oeuvreTitre} » de ${infos.artisteNom}`,
    `Prix : ${formatFcfa(infos.prixFcfa)}`,
    "",
    `Client : ${infos.clientNom}`,
    `Tél. : ${infos.telephone}`,
    `Email : ${infos.clientEmail}`,
    `Ville : ${infos.ville}`,
    infos.adresse ? `Adresse : ${infos.adresse}` : null,
    infos.message ? `Message : ${infos.message.slice(0, 300)}` : null,
    "",
    site ? `Gérer la commande : ${site}/admin/commandes` : null,
  ];
  return envoyerWhatsapp(lignes.filter((l) => l !== null).join("\n").trim());
}
