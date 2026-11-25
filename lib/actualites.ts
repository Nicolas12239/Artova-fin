import { query, type Param } from "./db";
import { slugifier } from "./validation";
import type { Actualite, Categorie, CommentaireActualite, Portee } from "./actualites-commun";
import { avecLangue, type Langue } from "./actualites-i18n";

// Tout ce qui est partagé avec le navigateur vit dans actualites-commun.ts.
export * from "./actualites-commun";

// Le Togo passe devant l'Afrique, qui passe devant le reste du monde : à
// importance égale, l'actualité de la maison remonte en premier.
const SCORE = `(a.importance + CASE a.portee WHEN 'togo' THEN 2 WHEN 'afrique' THEN 1 ELSE 0 END)`;

const COLONNES = `a.id, a.titre, a.resume, a.contenu, a.url_source, a.source_nom, a.image_url,
  a.portee, a.categorie, a.importance, a.a_la_une, a.statut, a.origine, a.publie_le,
  DATE_FORMAT(a.evenement_debut, '%Y-%m-%d') AS evenement_debut,
  DATE_FORMAT(a.evenement_fin, '%Y-%m-%d') AS evenement_fin, a.lieu, a.videos, a.artiste_slug, a.images, a.credit_image, a.personnes, a.traductions,
  (SELECT COUNT(*) FROM actualites_likes l WHERE l.actualite_id = a.id) AS nb_likes,
  (SELECT COUNT(*) FROM actualites_commentaires c WHERE c.actualite_id = a.id AND c.statut = 'publie') AS nb_commentaires`;

export interface FiltreActualites {
  portee?: Portee;
  categorie?: Categorie;
}

function clauseFiltre(filtre: FiltreActualites): { sql: string; params: Param[] } {
  const conditions = ["a.statut = 'publie'"];
  const params: Param[] = [];
  if (filtre.portee) {
    conditions.push("a.portee = ?");
    params.push(filtre.portee);
  }
  if (filtre.categorie) {
    conditions.push("a.categorie = ?");
    params.push(filtre.categorie);
  }
  return { sql: conditions.join(" AND "), params };
}

// L'actualité la plus forte des derniers jours : épinglée par l'équipe d'abord,
// sinon la mieux notée. Retombe sur la plus récente quand rien n'est frais.
export async function actualiteALaUne(filtre: FiltreActualites = {}): Promise<Actualite | null> {
  const { sql, params } = clauseFiltre(filtre);
  const frais = await query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE ${sql} AND a.publie_le >= ?
     ORDER BY a.a_la_une DESC, ${SCORE} DESC, a.publie_le DESC LIMIT 1`,
    [...params, new Date(Date.now() - 4 * 86_400_000)],
  );
  if (frais[0]) return frais[0];
  const recent = await query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a WHERE ${sql} ORDER BY a.a_la_une DESC, a.publie_le DESC LIMIT 1`,
    params,
  );
  return recent[0] ?? null;
}

// Du plus récent au plus ancien, jour par jour ; dans une même journée, l'actualité
// togolaise passe avant le reste du monde.
export async function listerActualites(
  filtre: FiltreActualites,
  { limite, decalage = 0, sauf }: { limite: number; decalage?: number; sauf?: number },
): Promise<Actualite[]> {
  const { sql, params } = clauseFiltre(filtre);
  const exclusion = sauf ? "AND a.id <> ?" : "";
  const valeurs: Param[] = [...params];
  if (sauf) valeurs.push(sauf);
  // LIMIT/OFFSET sont des entiers contrôlés : pas de paramètre préparé ici.
  const l = Math.max(1, Math.min(60, Math.floor(limite)));
  const d = Math.max(0, Math.floor(decalage));
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE ${sql} ${exclusion}
     ORDER BY DATE(a.publie_le) DESC, (a.portee = 'togo') DESC, a.publie_le DESC, a.id DESC LIMIT ${l} OFFSET ${d}`,
    valeurs,
  );
}

export async function compterActualites(filtre: FiltreActualites): Promise<number> {
  const { sql, params } = clauseFiltre(filtre);
  const rows = await query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM actualites a WHERE ${sql}`,
    params,
  );
  return Number(rows[0]?.n ?? 0);
}

export async function actualiteParId(id: number): Promise<Actualite | null> {
  const rows = await query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a WHERE a.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

// À lire ensuite : même catégorie ou même portée, hors article courant.
export async function actualitesLiees(actualite: Actualite, limite = 3): Promise<Actualite[]> {
  const l = Math.max(1, Math.min(12, Math.floor(limite)));
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publie' AND a.id <> ?
     ORDER BY (a.categorie = ?) DESC, (a.portee = ?) DESC, a.publie_le DESC LIMIT ${l}`,
    [actualite.id, actualite.categorie, actualite.portee],
  );
}

export async function aAime(actualiteId: number, utilisateurId: number): Promise<boolean> {
  const rows = await query<{ n: number }>(
    "SELECT 1 AS n FROM actualites_likes WHERE actualite_id = ? AND utilisateur_id = ? LIMIT 1",
    [actualiteId, utilisateurId],
  );
  return rows.length > 0;
}

export async function commentairesActualite(actualiteId: number): Promise<CommentaireActualite[]> {
  return query<CommentaireActualite>(
    `SELECT c.id, c.utilisateur_id, u.nom AS auteur, c.texte, c.cree_le
     FROM actualites_commentaires c JOIN utilisateurs u ON u.id = c.utilisateur_id
     WHERE c.actualite_id = ? AND c.statut = 'publie'
     ORDER BY c.cree_le ASC, c.id ASC LIMIT 200`,
    [actualiteId],
  );
}

// /actualites/123-titre-de-l-article : seul le nombre en tête compte, le reste
// sert au référencement et à la lisibilité du lien partagé.
export function lienActualite(a: { id: number; titre: string }, langue: Langue = "fr"): string {
  const slug = slugifier(a.titre).slice(0, 70).replace(/-+$/, "");
  return avecLangue(`/actualites/${a.id}${slug ? `-${slug}` : ""}`, langue);
}

export function idDepuisLien(segment: string): number | null {
  const m = /^(\d{1,9})(?:-|$)/.exec(segment);
  return m ? Number(m[1]) : null;
}

// L'agenda de l'art à Lomé : expositions et rendez-vous en cours, ou à venir dans
// les trois semaines, plus ceux qui viennent de se terminer.
export async function agendaLome(limite = 6): Promise<Actualite[]> {
  const jour = 86_400_000;
  const debutFenetre = new Date(Date.now() - 4 * jour).toISOString().slice(0, 10);
  const finFenetre = new Date(Date.now() + 21 * jour).toISOString().slice(0, 10);
  const l = Math.max(1, Math.min(12, Math.floor(limite)));
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publie' AND a.evenement_debut IS NOT NULL
       AND COALESCE(a.evenement_fin, a.evenement_debut) >= ? AND a.evenement_debut <= ?
     ORDER BY (COALESCE(a.evenement_fin, a.evenement_debut) < ?) ASC, a.evenement_debut ASC, a.id ASC LIMIT ${l}`,
    [debutFenetre, finFenetre, new Date().toISOString().slice(0, 10)],
  );
}

// Tout l'agenda : en cours, à venir (six mois) et terminé depuis moins d'un mois.
export async function agendaComplet(): Promise<Actualite[]> {
  const jour = 86_400_000;
  const debutFenetre = new Date(Date.now() - 30 * jour).toISOString().slice(0, 10);
  const finFenetre = new Date(Date.now() + 183 * jour).toISOString().slice(0, 10);
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publie' AND a.evenement_debut IS NOT NULL
       AND COALESCE(a.evenement_fin, a.evenement_debut) >= ? AND a.evenement_debut <= ?
     ORDER BY a.evenement_debut ASC, a.id ASC LIMIT 60`,
    [debutFenetre, finFenetre],
  );
}

export async function actualitesEnVideo(limite = 3): Promise<Actualite[]> {
  const l = Math.max(1, Math.min(12, Math.floor(limite)));
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publie' AND a.videos IS NOT NULL AND a.videos <> ''
     ORDER BY a.publie_le DESC, a.id DESC LIMIT ${l}`,
  );
}

export interface ArtisteLie {
  slug: string;
  nom: string;
  discipline: string;
  portrait_url: string | null;
}

export async function artisteLie(slug: string | null): Promise<ArtisteLie | null> {
  if (!slug) return null;
  const rows = await query<ArtisteLie>(
    "SELECT slug, nom, discipline, portrait_url FROM artistes WHERE slug = ? AND statut = 'publie' LIMIT 1",
    [slug],
  );
  return rows[0] ?? null;
}

// Portraits des artistes ArTova cités dans un article, par identifiant de page.
export async function portraitsArtistes(slugs: string[]): Promise<Map<string, string | null>> {
  const uniques = [...new Set(slugs)].slice(0, 20);
  const resultat = new Map<string, string | null>();
  if (uniques.length === 0) return resultat;
  const rows = await query<{ slug: string; portrait_url: string | null }>(
    `SELECT slug, portrait_url FROM artistes WHERE statut = 'publie' AND slug IN (${uniques.map(() => "?").join(",")})`,
    uniques,
  );
  for (const r of rows) resultat.set(r.slug, r.portrait_url);
  return resultat;
}

// Actualités qui parlent d'un artiste de la plateforme (articles liés à sa page).
export async function actualitesDeLArtiste(slug: string, limite = 3): Promise<Actualite[]> {
  const l = Math.max(1, Math.min(12, Math.floor(limite)));
  return query<Actualite>(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publie' AND a.artiste_slug = ?
     ORDER BY a.publie_le DESC, a.id DESC LIMIT ${l}`,
    [slug],
  );
}
