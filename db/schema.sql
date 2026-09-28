-- ArTova — schéma de base de données (MySQL / MariaDB via phpMyAdmin)
CREATE DATABASE IF NOT EXISTS artova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE artova;

DROP TABLE IF EXISTS commandes;
DROP TABLE IF EXISTS oeuvres;
DROP TABLE IF EXISTS artistes;
DROP TABLE IF EXISTS utilisateurs;

CREATE TABLE utilisateurs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  telephone VARCHAR(40) DEFAULT NULL,
  role ENUM('client','admin') NOT NULL DEFAULT 'client',
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_utilisateurs_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE artistes (
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
  portrait_url VARCHAR(255) NOT NULL,
  cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_artistes_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE oeuvres (
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
  CONSTRAINT fk_oeuvres_artiste FOREIGN KEY (artiste_id) REFERENCES artistes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commandes (
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
  CONSTRAINT fk_commandes_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id) ON DELETE CASCADE,
  CONSTRAINT fk_commandes_oeuvre FOREIGN KEY (oeuvre_id) REFERENCES oeuvres (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
