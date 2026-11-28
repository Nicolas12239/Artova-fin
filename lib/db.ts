import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { SOURCES_PAR_DEFAUT } from "./actualites-sources";
import { ARTICLES_REDACTION, CLES_OBSOLETES, empreinteRedaction } from "./actualites-redaction";
import { ARTICLES_DECOUVERTES } from "./actualites-decouvertes";
import { ARTICLES_ENQUETES } from "./actualites-enquetes";
import { ecrireMotsCles, extraireMotsCles } from "./actualites-motscles";
import { SOURCES_SOCIALES_PAR_DEFAUT } from "./actualites-sources";
import { lirePersonnes } from "./actualites-commun";
import { slugTag } from "./actualites-tags";

export type Param = string | number | boolean | Date | Buffer | null;

const pool = mysql.createPool({
  host: process.env.TIDB_HOST ?? process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.TIDB_PORT ?? process.env.DB_PORT ?? 3306),
  user: process.env.TIDB_USER ?? process.env.DB_USER ?? "root",
  password: process.env.TIDB_PASSWORD ?? process.env.DB_PASSWORD ?? "",
  database: process.env.TIDB_DATABASE ?? process.env.DB_NAME ?? "artova",
  ssl:
    process.env.DB_SSL === "1" || process.env.TIDB_HOST
      ? { rejectUnauthorized: true }
      : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4_unicode_ci",
});

// Migrations idempotentes appliquées une seule fois par processus, au premier
// accès à la base : les migrations sont exécutées au premier accès SQL.
async function colonneExiste(table: string, colonne: string): Promise<boolean> {
  const [rows] = await pool.execute(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, colonne],
  );
  return (rows as unknown[]).length > 0;
}

async function migrer(): Promise<void> {
  await pool.query(
    "ALTER TABLE utilisateurs MODIFY role ENUM('client','artiste','admin') NOT NULL DEFAULT 'client'",
  );
  await pool.query(`CREATE TABLE IF NOT EXISTS fichiers (
    id CHAR(32) NOT NULL,
    type VARCHAR(40) NOT NULL,
    donnees MEDIUMBLOB NOT NULL,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const colonnesArtistes: [string, string][] = [
    ["utilisateur_id", "INT UNSIGNED DEFAULT NULL, ADD UNIQUE KEY uq_artistes_utilisateur (utilisateur_id)"],
    ["statut", "ENUM('brouillon','en_attente','publie') NOT NULL DEFAULT 'publie'"],
    ["banniere_url", "VARCHAR(255) DEFAULT NULL"],
    ["annee_debut", "SMALLINT UNSIGNED DEFAULT NULL"],
    ["formation", "VARCHAR(255) DEFAULT NULL"],
    ["techniques", "VARCHAR(255) DEFAULT NULL"],
    ["expositions", "TEXT DEFAULT NULL"],
    ["commission_acceptee_le", "TIMESTAMP NULL DEFAULT NULL"],
  ];
  for (const [colonne, definition] of colonnesArtistes) {
    if (!(await colonneExiste("artistes", colonne))) {
      await pool.query(`ALTER TABLE artistes ADD COLUMN ${colonne} ${definition}`);
    }
  }
  await pool.query("ALTER TABLE artistes MODIFY portrait_url VARCHAR(255) DEFAULT NULL");

  // Comptes Firebase (Google, Apple, lien e-mail) : pas forcément de mot de passe local.
  await pool.query("ALTER TABLE utilisateurs MODIFY mot_de_passe_hash VARCHAR(255) DEFAULT NULL");
  if (!(await colonneExiste("utilisateurs", "firebase_uid"))) {
    await pool.query(
      "ALTER TABLE utilisateurs ADD COLUMN firebase_uid VARCHAR(128) DEFAULT NULL, ADD UNIQUE KEY uq_utilisateurs_firebase_uid (firebase_uid)",
    );
  }

  // Vue lisible (phpMyAdmin, exports) de toutes les personnes inscrites et de
  // leur statut : collectionneur, artiste ou administrateur.
  await pool.query(`CREATE OR REPLACE VIEW inscrits AS
    SELECT
      u.id,
      u.nom,
      u.email,
      u.telephone,
      CASE u.role
        WHEN 'client' THEN 'Collectionneur'
        WHEN 'artiste' THEN 'Artiste'
        ELSE 'Administrateur'
      END AS statut,
      CASE
        WHEN u.firebase_uid IS NOT NULL AND u.mot_de_passe_hash IS NULL THEN 'Google, Apple ou lien e-mail'
        ELSE 'E-mail et mot de passe'
      END AS methode_connexion,
      a.nom AS nom_artiste,
      CASE a.statut
        WHEN 'publie' THEN 'Publiée'
        WHEN 'en_attente' THEN 'En attente de validation'
        WHEN 'brouillon' THEN 'Brouillon'
        ELSE NULL
      END AS page_artiste,
      (SELECT COUNT(*) FROM commandes c WHERE c.utilisateur_id = u.id) AS nb_commandes,
      u.cree_le AS inscrit_le
    FROM utilisateurs u
    LEFT JOIN artistes a ON a.utilisateur_id = u.id`);

  // Les actualités sont un module à part : si leur migration échoue, le reste du
  // site (œuvres, commandes, comptes) doit continuer à fonctionner.
  try {
    await migrerActualites();
  } catch (erreur) {
    console.error("[ArTova] Migration des actualités :", erreur);
  }
}

// Identifiant d'un tag : « A. Sika » devient « a-sika », comme sa page d'artiste.
export { slugTag };

// Remplace les tags d'une actualité par les personnes citées (JSON de `personnes`).
async function poserTagsInterne(actualiteId: number, personnes: string | null): Promise<void> {
  await pool.query("DELETE FROM actualites_tags WHERE actualite_id = ?", [actualiteId]);
  const vus = new Set<string>();
  for (const p of lirePersonnes(personnes)) {
    const slug = slugTag(p.nom);
    if (!slug || vus.has(slug)) continue;
    vus.add(slug);
    await pool.query("INSERT IGNORE INTO actualites_tags (actualite_id, slug, nom) VALUES (?, ?, ?)", [
      actualiteId,
      slug,
      p.nom.slice(0, 100),
    ]);
  }
}

export async function poserTags(actualiteId: number, personnes: string | null): Promise<void> {
  await pret();
  await poserTagsInterne(actualiteId, personnes);
}

// Actualités de l'art : sources suivies, publications, « j'aime » et commentaires.
async function migrerActualites(): Promise<void> {
  const table = (nom: string, corps: string) =>
    pool.query(
      `CREATE TABLE IF NOT EXISTS ${nom} (${corps}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

  await table(
    "sources_actualites",
    `id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     nom VARCHAR(120) NOT NULL,
     url_flux VARCHAR(255) NOT NULL,
     portee ENUM('togo','afrique','monde') NOT NULL DEFAULT 'monde',
     langue VARCHAR(5) NOT NULL DEFAULT 'fr',
     filtrer TINYINT(1) NOT NULL DEFAULT 1,
     actif TINYINT(1) NOT NULL DEFAULT 1,
     derniere_collecte TIMESTAMP NULL DEFAULT NULL,
     derniere_erreur VARCHAR(255) DEFAULT NULL,
     nb_articles INT UNSIGNED NOT NULL DEFAULT 0,
     PRIMARY KEY (id),
     UNIQUE KEY uq_sources_actualites_url (url_flux)`,
  );
  await table(
    "actualites",
    `id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     empreinte CHAR(40) NOT NULL,
     titre VARCHAR(300) NOT NULL,
     resume TEXT NOT NULL,
     contenu MEDIUMTEXT DEFAULT NULL,
     url_source VARCHAR(1000) DEFAULT NULL,
     source_nom VARCHAR(120) NOT NULL,
     image_url VARCHAR(1000) DEFAULT NULL,
     portee ENUM('togo','afrique','monde') NOT NULL DEFAULT 'monde',
     categorie VARCHAR(30) NOT NULL DEFAULT 'general',
     importance TINYINT UNSIGNED NOT NULL DEFAULT 5,
     a_la_une TINYINT(1) NOT NULL DEFAULT 0,
     statut ENUM('publie','masque') NOT NULL DEFAULT 'publie',
     origine ENUM('auto','manuel') NOT NULL DEFAULT 'auto',
     source_id INT UNSIGNED DEFAULT NULL,
     publie_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     evenement_debut DATE DEFAULT NULL,
     evenement_fin DATE DEFAULT NULL,
     lieu VARCHAR(160) DEFAULT NULL,
     videos TEXT DEFAULT NULL,
     artiste_slug VARCHAR(120) DEFAULT NULL,
     images TEXT DEFAULT NULL,
     credit_image VARCHAR(160) DEFAULT NULL,
     personnes TEXT DEFAULT NULL,
     traductions MEDIUMTEXT DEFAULT NULL,
     revision SMALLINT UNSIGNED NOT NULL DEFAULT 0,
     PRIMARY KEY (id),
     UNIQUE KEY uq_actualites_empreinte (empreinte),
     KEY idx_actualites_liste (statut, publie_le),
     KEY idx_actualites_evenement (evenement_debut)`,
  );
  // Mémoire des publications déjà examinées, publiées ou écartées : l'IA ne
  // repasse jamais deux fois sur la même.
  await table(
    "actualites_vues",
    `empreinte CHAR(40) NOT NULL,
     vu_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (empreinte)`,
  );
  // Une ligne par personne citée dans une actualité : alimente les pages « tag »
  // (tous les articles sur un artiste) et l'index des artistes cités.
  await table(
    "actualites_tags",
    `actualite_id INT UNSIGNED NOT NULL,
     slug VARCHAR(100) NOT NULL,
     nom VARCHAR(100) NOT NULL,
     PRIMARY KEY (actualite_id, slug),
     KEY idx_actualites_tags_slug (slug)`,
  );
  await table(
    "actualites_likes",
    `actualite_id INT UNSIGNED NOT NULL,
     utilisateur_id INT UNSIGNED NOT NULL,
     cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (actualite_id, utilisateur_id)`,
  );
  await table(
    "actualites_commentaires",
    `id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     actualite_id INT UNSIGNED NOT NULL,
     utilisateur_id INT UNSIGNED NOT NULL,
     texte VARCHAR(1000) NOT NULL,
     statut ENUM('publie','masque') NOT NULL DEFAULT 'publie',
     cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (id),
     KEY idx_actualites_commentaires (actualite_id, cree_le)`,
  );

  // Rattrape les tags des actualités déjà publiées (une seule fois pour chacune).
  const [sansTags] = await pool.query(
    `SELECT a.id, a.personnes FROM actualites a
     WHERE a.personnes IS NOT NULL AND NOT EXISTS (SELECT 1 FROM actualites_tags t WHERE t.actualite_id = a.id)
     LIMIT 500`,
  );
  for (const r of sansTags as { id: number; personnes: string | null }[]) await poserTagsInterne(r.id, r.personnes);

  // Colonnes ajoutées après la première mise en ligne.
  for (const [colonne, definition] of [
    ["videos", "TEXT DEFAULT NULL"],
    ["artiste_slug", "VARCHAR(120) DEFAULT NULL"],
    ["images", "TEXT DEFAULT NULL"],
    ["credit_image", "VARCHAR(160) DEFAULT NULL"],
    ["personnes", "TEXT DEFAULT NULL"],
    ["traductions", "MEDIUMTEXT DEFAULT NULL"],
    ["enquete", "TEXT DEFAULT NULL"],
    ["enquete_le", "TIMESTAMP NULL DEFAULT NULL"],
    ["mots_cles", "TEXT DEFAULT NULL"],
    ["revision", "SMALLINT UNSIGNED NOT NULL DEFAULT 0"],
  ] as const) {
    if (!(await colonneExiste("actualites", colonne))) {
      await pool.query(`ALTER TABLE actualites ADD COLUMN ${colonne} ${definition}`);
    }
  }

  // Comptes et mots-dièse des réseaux sociaux suivis (voir lib/actualites-social.ts).
  await table(
    "sources_sociales",
    `id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     plateforme VARCHAR(20) NOT NULL,
     identifiant VARCHAR(160) NOT NULL,
     nom VARCHAR(160) NOT NULL,
     portee VARCHAR(10) NOT NULL DEFAULT 'togo',
     filtrer TINYINT(1) NOT NULL DEFAULT 0,
     actif TINYINT(1) NOT NULL DEFAULT 1,
     derniere_collecte TIMESTAMP NULL DEFAULT NULL,
     derniere_erreur VARCHAR(255) DEFAULT NULL,
     nb_publications INT UNSIGNED NOT NULL DEFAULT 0,
     PRIMARY KEY (id),
     UNIQUE KEY uq_sources_sociales (plateforme, identifiant)`,
  );

  const dejaVu = async (empreinte: string): Promise<boolean> => {
    const [rows] = await pool.query("SELECT 1 FROM actualites_vues WHERE empreinte = ? LIMIT 1", [empreinte]);
    return (rows as unknown[]).length > 0;
  };
  const marquer = (empreinte: string) =>
    pool.query("INSERT IGNORE INTO actualites_vues (empreinte) VALUES (?)", [empreinte]);

  // Sources de départ : chaque source n'est posée qu'une fois. Une source retirée
  // depuis l'administration ne revient donc pas.
  for (const s of SOURCES_PAR_DEFAUT) {
    const cle = createHash("sha1").update(`source:${s.url_flux}`).digest("hex");
    if (await dejaVu(cle)) continue;
    await pool.query(
      "INSERT IGNORE INTO sources_actualites (nom, url_flux, portee, langue, filtrer) VALUES (?, ?, ?, ?, ?)",
      [s.nom, s.url_flux, s.portee, s.langue, s.filtrer ? 1 : 0],
    );
    await marquer(cle);
  }

  // Comptes sociaux de départ (posés une fois ; l'administration les gère ensuite).
  for (const s of SOURCES_SOCIALES_PAR_DEFAUT) {
    const cle = createHash("sha1").update(`social:${s.plateforme}:${s.identifiant}`).digest("hex");
    if (await dejaVu(cle)) continue;
    await pool.query(
      "INSERT IGNORE INTO sources_sociales (plateforme, identifiant, nom, portee, filtrer) VALUES (?, ?, ?, ?, ?)",
      [s.plateforme, s.identifiant, s.nom, s.portee, s.filtrer ? 1 : 0],
    );
    await marquer(cle);
  }

  // Articles de la rédaction ArTova : posés une fois, puis modifiables ou
  // supprimables depuis l'administration (un article supprimé ne revient pas).
  // Quand le code augmente le numéro de révision d'un article, sa fiche est
  // réécrite : c'est la seule façon de remplacer une modification de l'admin.
  for (const cle of CLES_OBSOLETES) {
    const empreinte = createHash("sha1").update(`redaction:${cle}`).digest("hex");
    const [anciens] = await pool.query("SELECT id FROM actualites WHERE empreinte = ? AND origine = 'manuel'", [empreinte]);
    for (const { id } of anciens as { id: number }[]) {
      await pool.query("DELETE FROM actualites_likes WHERE actualite_id = ?", [id]);
      await pool.query("DELETE FROM actualites_commentaires WHERE actualite_id = ?", [id]);
      await pool.query("DELETE FROM actualites WHERE id = ?", [id]);
    }
    await marquer(empreinte);
  }

  for (const a of [...ARTICLES_REDACTION, ...ARTICLES_ENQUETES, ...ARTICLES_DECOUVERTES]) {
    const empreinte = empreinteRedaction(a);
    const champs = [
      a.titre, a.resume, a.contenu ?? null, a.url_source ?? null, a.source_nom, a.image_url ?? null,
      a.portee, a.categorie, a.importance, a.a_la_une ? 1 : 0, new Date(a.publie_le),
      a.evenement_debut ?? null, a.evenement_fin ?? null, a.lieu ?? null, a.videos ?? null,
      a.artiste_slug ?? null, a.images ?? null, a.credit_image ?? null,
      a.personnes ? JSON.stringify(a.personnes) : null,
      a.traductions ? JSON.stringify(a.traductions) : null, a.revision,
      a.enquete ? JSON.stringify(a.enquete) : null,
    ];
    const [existant] = await pool.query("SELECT id, revision FROM actualites WHERE empreinte = ? LIMIT 1", [empreinte]);
    const ligne = (existant as { id: number; revision: number }[])[0];
    if (ligne) {
      if (ligne.revision < a.revision) {
        await pool.query(
          `UPDATE actualites SET titre=?, resume=?, contenu=?, url_source=?, source_nom=?, image_url=?, portee=?,
           categorie=?, importance=?, a_la_une=?, publie_le=?, evenement_debut=?, evenement_fin=?, lieu=?,
           videos=?, artiste_slug=?, images=?, credit_image=?, personnes=?, traductions=?, revision=?, enquete=? WHERE id=?`,
          [...champs, ligne.id],
        );
        await poserTagsInterne(ligne.id, a.personnes ? JSON.stringify(a.personnes) : null);
      }
      continue;
    }
    if (await dejaVu(empreinte)) continue;
    const [insere] = await pool.query(
      `INSERT IGNORE INTO actualites
       (empreinte, titre, resume, contenu, url_source, source_nom, image_url, portee, categorie, importance,
        a_la_une, publie_le, evenement_debut, evenement_fin, lieu, videos, artiste_slug, images, credit_image,
        personnes, traductions, revision, enquete, origine)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manuel')`,
      [empreinte, ...champs],
    );
    const idInsere = Number((insere as { insertId?: number }).insertId ?? 0);
    if (idInsere > 0) await poserTagsInterne(idInsere, a.personnes ? JSON.stringify(a.personnes) : null);
    await marquer(empreinte);
  }

  // Mots retenus des articles qui n'en ont pas encore (par paquets, au démarrage).
  const [sansMots] = await pool.query(
    "SELECT id, titre, resume, contenu, lieu FROM actualites WHERE mots_cles IS NULL LIMIT 300",
  );
  for (const r of sansMots as { id: number; titre: string; resume: string; contenu: string | null; lieu: string | null }[]) {
    const mots = ecrireMotsCles(extraireMotsCles([r.titre, r.resume, r.contenu ?? "", r.lieu ?? ""].join("\n")));
    // Chaîne vide : « examiné, rien à retenir » (l'article n'est pas repris).
    await pool.query("UPDATE actualites SET mots_cles = ? WHERE id = ?", [mots ?? "", r.id]);
  }
}

let migration: Promise<void> | null = null;

function pret(): Promise<void> {
  if (!migration) {
    migration = migrer().catch((erreur) => {
      migration = null;
      throw erreur;
    });
  }
  return migration;
}

export async function query<T>(sql: string, params: Param[] = []): Promise<T[]> {
  await pret();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params: Param[] = [],
): Promise<mysql.ResultSetHeader> {
  await pret();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
