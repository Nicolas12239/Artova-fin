import mysql from "mysql2/promise";

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
