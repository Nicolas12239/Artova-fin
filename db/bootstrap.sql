CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mot_de_passe_hash VARCHAR(255) DEFAULT NULL,
  telephone VARCHAR(40) DEFAULT NULL,
  role ENUM('client','artiste','admin') NOT NULL DEFAULT 'client',
  firebase_uid VARCHAR(128) DEFAULT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_utilisateurs_email (email),
  UNIQUE KEY uq_utilisateurs_firebase_uid (firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artistes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  nom VARCHAR(120) NOT NULL,
  discipline ENUM('peintre','plasticien','sculpteur') NOT NULL,
  ville VARCHAR(80) DEFAULT NULL,
  histoire TEXT NOT NULL,
  note_univers VARCHAR(255) DEFAULT NULL,
  theme_primaire CHAR(7) NOT NULL DEFAULT '#241D18',
  theme_accent CHAR(7) NOT NULL DEFAULT '#A65A41',
  theme_fond CHAR(7) NOT NULL DEFAULT '#F7F5EF',
  motif ENUM('pinceau','collage','pierre') NOT NULL DEFAULT 'pinceau',
  portrait_url VARCHAR(255) DEFAULT NULL,
  banniere_url VARCHAR(255) DEFAULT NULL,
  utilisateur_id INT UNSIGNED DEFAULT NULL,
  statut ENUM('brouillon','en_attente','publie') NOT NULL DEFAULT 'publie',
  annee_debut SMALLINT UNSIGNED DEFAULT NULL,
  formation VARCHAR(255) DEFAULT NULL,
  techniques VARCHAR(255) DEFAULT NULL,
  expositions TEXT DEFAULT NULL,
  commission_acceptee_le TIMESTAMP NULL DEFAULT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_artistes_slug (slug),
  UNIQUE KEY uq_artistes_utilisateur (utilisateur_id),
  CONSTRAINT fk_artistes_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oeuvres (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  artiste_id INT UNSIGNED NOT NULL,
  titre VARCHAR(160) NOT NULL,
  type ENUM('toile','sculpture') NOT NULL,
  prix_fcfa INT UNSIGNED NOT NULL,
  annee SMALLINT UNSIGNED DEFAULT NULL,
  dimensions VARCHAR(80) DEFAULT NULL,
  technique VARCHAR(160) DEFAULT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  oeuvre_maitre TINYINT(1) NOT NULL DEFAULT 0,
  statut ENUM('disponible','reserve','vendu') NOT NULL DEFAULT 'disponible',
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_oeuvres_artiste (artiste_id),
  CONSTRAINT fk_oeuvres_artiste FOREIGN KEY (artiste_id)
    REFERENCES artistes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commandes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(20) NOT NULL,
  utilisateur_id INT UNSIGNED NOT NULL,
  oeuvre_id INT UNSIGNED NOT NULL,
  statut ENUM('en_attente','confirmee','expediee','livree','annulee') NOT NULL DEFAULT 'en_attente',
  telephone VARCHAR(40) NOT NULL,
  ville VARCHAR(80) NOT NULL,
  adresse VARCHAR(255) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_commandes_reference (reference),
  KEY idx_commandes_utilisateur (utilisateur_id),
  KEY idx_commandes_oeuvre (oeuvre_id),
  CONSTRAINT fk_commandes_utilisateur FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs (id) ON DELETE CASCADE,
  CONSTRAINT fk_commandes_oeuvre FOREIGN KEY (oeuvre_id)
    REFERENCES oeuvres (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fichiers (
  id CHAR(32) NOT NULL,
  type VARCHAR(40) NOT NULL,
  donnees MEDIUMBLOB NOT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW inscrits AS
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
  LEFT JOIN artistes a ON a.utilisateur_id = u.id;
