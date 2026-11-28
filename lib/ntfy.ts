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

export interface Notification {
  titre: string;
  message: string;
  lien?: string;
  etiquettes?: string[];
}

const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// Envoi à ntfy, avec deux nouvelles tentatives : le service limite le nombre de
// messages par adresse, et les serveurs de l'hébergeur partagent leurs adresses.
// Un jeton de compte ntfy (NTFY_TOKEN) donne à ArTova son propre quota.
export async function envoyerPush(notification: Notification): Promise<boolean> {
  const config = canalNtfy();
  if (!config) {
    console.log(
      `[ArTova] Notification push non configurée (NTFY_TOPIC absente), message journalisé :\n${notification.titre}\n${notification.message}`,
    );
    return false;
  }
  const jeton = process.env.NTFY_TOKEN?.trim();
  let echec = "";
  for (const attente of [0, 1500, 4000]) {
    if (attente) await pause(attente);
    try {
      const reponse = await fetch(`${config.serveur}/${encodeURIComponent(config.canal)}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Title: titrePourEntete(notification.titre),
          Priority: "4",
          Tags: (notification.etiquettes ?? ["art"]).join(","),
          ...(notification.lien ? { Click: notification.lien } : {}),
          ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        },
        body: notification.message,
        signal: AbortSignal.timeout(7000),
        cache: "no-store",
      });
      if (reponse.ok) return true;
      echec = `ntfy ${reponse.status} : ${(await reponse.text()).slice(0, 200)}`;
      // Une demande refusée (jeton, canal) le restera : inutile d'insister.
      if (reponse.status !== 429 && reponse.status < 500) break;
    } catch (erreur) {
      echec = `ntfy injoignable : ${erreur instanceof Error ? erreur.message : String(erreur)}`;
    }
  }
  throw new Error(echec);
}
