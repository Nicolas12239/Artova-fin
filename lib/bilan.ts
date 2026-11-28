import { createHash } from "node:crypto";
import { actualiteALaUne } from "./actualites";
import { imageAccessible } from "./actualites-recherche";
import { redigerBilan, type ArticleBilan } from "./bilan-regles";
import { query } from "./db";
import { notifier, renvoyerEnAttente } from "./notifications";
import { getSiteUrl } from "./ntfy";
import { SITE_URL } from "./site";

const CHAMPS = `id, titre, resume, contenu, publie_le, DATE_FORMAT(evenement_debut, '%Y-%m-%d') AS evenement_debut,
  DATE_FORMAT(evenement_fin, '%Y-%m-%d') AS evenement_fin, origine, categorie`;

// Vérifie les images des articles les plus visibles (une, agenda, derniers parus).
async function imagesCassees(echeance: number): Promise<string[]> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const articles = await query<{ titre: string; image_url: string }>(
    `SELECT titre, image_url FROM actualites
     WHERE statut = 'publie' AND image_url IS NOT NULL AND categorie <> 'decouverte'
     ORDER BY (COALESCE(evenement_fin, evenement_debut) >= ?) DESC, publie_le DESC LIMIT 36`,
    [aujourdhui],
  );
  const cassees: string[] = [];
  for (let i = 0; i < articles.length && Date.now() < echeance; i += 6) {
    await Promise.all(
      articles.slice(i, i + 6).map(async (a) => {
        const adresse = a.image_url.startsWith("/") ? `${SITE_URL}${a.image_url}` : a.image_url;
        if (!(await imageAccessible(adresse))) cassees.push(a.titre);
      }),
    );
  }
  return cassees;
}

export async function preparerBilan() {
  const maintenant = new Date();
  const depuis = new Date(maintenant.getTime() - 60 * 86_400_000);
  const [articles, une, nouvelles, collecte, rss, reseaux, artistes, attente, cassees] = await Promise.all([
    query<ArticleBilan>(
      `SELECT ${CHAMPS} FROM actualites
       WHERE statut = 'publie' AND (publie_le >= ? OR COALESCE(evenement_fin, evenement_debut) >= ?)
       ORDER BY publie_le DESC LIMIT 700`,
      [depuis, new Date(maintenant.getTime() - 2 * 86_400_000).toISOString().slice(0, 10)],
    ),
    actualiteALaUne({ accueil: true }),
    query<{ n: number }>("SELECT COUNT(*) AS n FROM actualites WHERE statut = 'publie' AND publie_le >= ?", [
      new Date(maintenant.getTime() - 86_400_000),
    ]),
    query<{ le: Date | null }>("SELECT MAX(derniere_collecte) AS le FROM sources_actualites WHERE actif = 1"),
    query<{ nom: string }>("SELECT nom FROM sources_actualites WHERE actif = 1 AND derniere_erreur IS NOT NULL ORDER BY nom"),
    query<{ nom: string }>("SELECT nom FROM sources_sociales WHERE actif = 1 AND derniere_erreur IS NOT NULL ORDER BY nom"),
    query<{ nom: string }>("SELECT nom FROM artistes WHERE statut = 'en_attente' ORDER BY nom"),
    query<{ n: number }>("SELECT COUNT(*) AS n FROM notifications WHERE envoyee_le IS NULL AND cree_le >= ?", [
      new Date(maintenant.getTime() - 48 * 3600_000),
    ]),
    imagesCassees(Date.now() + 25_000),
  ]);
  return redigerBilan({
    maintenant,
    articles,
    une,
    nouvelles24h: Number(nouvelles[0]?.n ?? 0),
    derniereCollecte: collecte[0]?.le ? new Date(collecte[0].le) : null,
    imagesCassees: cassees,
    sourcesEnErreur: [...rss, ...reseaux].map((s) => s.nom),
    artistesEnAttente: artistes.map((a) => a.nom),
    notificationsEnAttente: Number(attente[0]?.n ?? 0),
  });
}

// Un bilan par jour au plus (le passage automatique) ; l'administration peut en
// demander un à tout moment.
export async function dejaEnvoyeAujourdhui(): Promise<boolean> {
  const cle = createHash("sha1").update(`bilan:${new Date().toISOString().slice(0, 10)}`).digest("hex");
  const r = await query<{ n: number }>("SELECT 1 AS n FROM actualites_vues WHERE empreinte = ?", [cle]);
  return r.length > 0;
}

export async function envoyerBilan(): Promise<{ points: number; envoye: boolean }> {
  await renvoyerEnAttente(8).catch(() => 0);
  const bilan = await preparerBilan();
  const site = getSiteUrl();
  const envoye = await notifier("bilan", {
    titre: bilan.titre,
    message: bilan.message,
    lien: site ? `${site}/admin/actualites` : undefined,
    etiquettes: [bilan.points > 0 ? "warning" : "white_check_mark", "newspaper"],
  });
  console.info(`[ArTova] Bilan quotidien : ${bilan.points} point(s), ${envoye ? "envoyé" : "non envoyé (nouvel essai plus tard)"}.`);
  return { points: bilan.points, envoye };
}
