import { formatFcfa } from "./format";

// Notifications push via ntfy (gratuit, sans compte) : le téléphone s'abonne
// au canal NTFY_TOPIC dans l'application ntfy. Le nom du canal fait office
// de secret, il ne doit pas être partagé.
export function canalNtfy(): { serveur: string; canal: string } | null {
  const canal = process.env.NTFY_TOPIC?.trim();
  if (!canal) return null;
  return {
    serveur: (process.env.NTFY_SERVER?.trim() || "https://ntfy.sh").replace(/\/+$/, ""),
    canal,
  };
}

export function getSiteUrl(): string | null {
  const valeur =
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!valeur) return null;
  return `${/^https?:\/\//i.test(valeur) ? "" : "https://"}${valeur}`.replace(/\/+$/, "");
}

function titrePourEntete(titre: string): string {
  const titreAscii = titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim();
  return titreAscii || "ArTova";
}

export async function envoyerPush(notification: {
  titre: string;
  message: string;
  lien?: string;
  etiquettes?: string[];
}): Promise<boolean> {
  const config = canalNtfy();
  if (!config) {
    console.log(
      `[ArTova] Notification push non configurée (NTFY_TOPIC absente), message journalisé :\n${notification.titre}\n${notification.message}`,
    );
    return false;
  }
  const reponse = await fetch(`${config.serveur}/${encodeURIComponent(config.canal)}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: titrePourEntete(notification.titre),
      Priority: "4",
      Tags: (notification.etiquettes ?? ["art"]).join(","),
      ...(notification.lien ? { Click: notification.lien } : {}),
    },
    body: notification.message,
    signal: AbortSignal.timeout(8000),
  });
  if (!reponse.ok) {
    throw new Error(`ntfy ${reponse.status} : ${(await reponse.text()).slice(0, 300)}`);
  }
  return true;
}

export async function sendCommandePush(infos: {
  reference: string;
  oeuvreTitre: string;
  artisteNom: string;
  prixFcfa: number;
  clientNom: string;
  ville: string;
}): Promise<boolean> {
  const site = getSiteUrl();
  return envoyerPush({
    titre: `Nouvelle commande ${infos.reference}`,
    message: [
      `« ${infos.oeuvreTitre} » de ${infos.artisteNom}`,
      formatFcfa(infos.prixFcfa),
      `Client : ${infos.clientNom}, ${infos.ville}`,
    ].join("\n"),
    lien: site ? `${site}/admin/commandes` : undefined,
    etiquettes: ["shopping_bags"],
  });
}

export async function sendNouvelArtistePush(infos: {
  nom: string;
  discipline: string;
  ville: string | null;
  motif: "inscription" | "soumission";
}): Promise<boolean> {
  const site = getSiteUrl();
  return envoyerPush({
    titre:
      infos.motif === "inscription"
        ? `Nouvel artiste à valider : ${infos.nom}`
        : `Page d'artiste à valider : ${infos.nom}`,
    message: [
      `${infos.discipline}${infos.ville ? `, ${infos.ville}` : ""}`,
      infos.motif === "inscription"
        ? "Vient de créer sa page ArTova."
        : "A soumis sa page pour publication.",
      "Touchez pour l'examiner et la publier.",
    ].join("\n"),
    lien: site ? `${site}/admin/artistes` : undefined,
    etiquettes: ["art", "bell"],
  });
}
