import { execute, query } from "./db";
import { formatFcfa } from "./format";
import { envoyerPush, getSiteUrl, type Notification } from "./ntfy";

// Notifications à l'équipe, sans perte : chacune est d'abord notée en base, puis
// envoyée. Si ntfy refuse ou ne répond pas, elle est renvoyée plus tard (à la
// prochaine visite du site ou au passage quotidien), pendant deux jours.

const ESSAIS_MAX = 20;

export interface NotificationNotee {
  id: number;
  type: string;
  titre: string;
  cree_le: Date;
  envoyee_le: Date | null;
  tentatives: number;
  derniere_erreur: string | null;
}

interface Ligne {
  id: number;
  titre: string;
  message: string;
  lien: string | null;
  etiquettes: string | null;
}

// Envoie une notification notée ; un seul processus à la fois pour une même ligne.
async function expedier(l: Ligne): Promise<boolean> {
  const reclamee = await execute(
    "UPDATE notifications SET tentatives = tentatives + 1, essai_le = NOW() WHERE id = ? AND envoyee_le IS NULL AND (essai_le IS NULL OR essai_le < ?)",
    [l.id, new Date(Date.now() - 2 * 60_000)],
  );
  if (reclamee.affectedRows === 0) return false;
  try {
    const envoyee = await envoyerPush({
      titre: l.titre,
      message: l.message,
      lien: l.lien ?? undefined,
      etiquettes: l.etiquettes?.split(",").filter(Boolean),
    });
    await execute("UPDATE notifications SET envoyee_le = IF(?, NOW(), NULL), derniere_erreur = ? WHERE id = ?", [
      envoyee ? 1 : 0,
      envoyee ? null : "NTFY_TOPIC absente",
      l.id,
    ]);
    return envoyee;
  } catch (erreur) {
    const texte = (erreur instanceof Error ? erreur.message : String(erreur)).slice(0, 250);
    console.error(`[ArTova] Notification #${l.id} non envoyée : ${texte}`);
    await execute("UPDATE notifications SET derniere_erreur = ? WHERE id = ?", [texte, l.id]);
    return false;
  }
}

export async function notifier(type: string, n: Notification): Promise<boolean> {
  const ligne = { titre: n.titre.slice(0, 200), message: n.message.slice(0, 3500), lien: n.lien ?? null, etiquettes: (n.etiquettes ?? ["art"]).join(",") };
  let id = 0;
  try {
    const ajout = await execute(
      "INSERT INTO notifications (type, titre, message, lien, etiquettes) VALUES (?, ?, ?, ?, ?)",
      [type, ligne.titre, ligne.message, ligne.lien, ligne.etiquettes],
    );
    id = Number(ajout.insertId);
  } catch (erreur) {
    // La base ne doit pas empêcher l'alerte de partir.
    console.error("[ArTova] Journal des notifications indisponible :", erreur);
    return envoyerPush(n);
  }
  return expedier({ id, ...ligne });
}

export async function renvoyerEnAttente(limite = 5): Promise<number> {
  const attente = await query<Ligne>(
    `SELECT id, titre, message, lien, etiquettes FROM notifications
     WHERE envoyee_le IS NULL AND tentatives < ${ESSAIS_MAX} AND cree_le >= ?
     ORDER BY id LIMIT ${Math.max(1, Math.min(20, Math.floor(limite)))}`,
    [new Date(Date.now() - 48 * 3600_000)],
  );
  let envoyees = 0;
  for (const l of attente) if (await expedier(l)) envoyees++;
  return envoyees;
}

export async function dernieresNotifications(limite = 8): Promise<NotificationNotee[]> {
  return query<NotificationNotee>(
    `SELECT id, type, titre, cree_le, envoyee_le, tentatives, derniere_erreur FROM notifications ORDER BY id DESC LIMIT ${Math.max(1, Math.min(30, Math.floor(limite)))}`,
  );
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
  return notifier("commande", {
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
  motif: "inscription" | "soumission" | "administration";
}): Promise<boolean> {
  const site = getSiteUrl();
  const titres = {
    inscription: `Nouvel artiste à valider : ${infos.nom}`,
    soumission: `Page d'artiste à valider : ${infos.nom}`,
    administration: `Page d'artiste créée : ${infos.nom}`,
  };
  const faits = {
    inscription: "Vient de créer sa page ArTova.",
    soumission: "A soumis sa page pour publication.",
    administration: "Page créée depuis l'administration.",
  };
  return notifier("artiste", {
    titre: titres[infos.motif],
    message: [
      `${infos.discipline}${infos.ville ? `, ${infos.ville}` : ""}`,
      faits[infos.motif],
      infos.motif === "administration" ? "Touchez pour la voir." : "Touchez pour l'examiner et la publier.",
    ].join("\n"),
    lien: site ? `${site}/admin/artistes` : undefined,
    etiquettes: ["art", "bell"],
  });
}
