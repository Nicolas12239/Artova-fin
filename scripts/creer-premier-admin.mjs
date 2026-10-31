import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const config = {
  host: process.env.TIDB_HOST ?? process.env.DB_HOST,
  port: process.env.TIDB_PORT ?? process.env.DB_PORT,
  user: process.env.TIDB_USER ?? process.env.DB_USER,
  password: process.env.TIDB_PASSWORD ?? process.env.DB_PASSWORD,
  database: process.env.TIDB_DATABASE ?? process.env.DB_NAME,
};
const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  throw new Error(`Paramètres de connexion TiDB/DB absents : ${missing.join(", ")}`);
}

const terminal = createInterface({ input: process.stdin, output: process.stdout });
const email = (await terminal.question("E-mail du premier administrateur : ")).trim().toLowerCase();
terminal.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Adresse e-mail invalide.");
}

function lireMotDePasseMasque() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Lancez cette commande depuis un terminal interactif pour saisir le mot de passe sans l'afficher.");
  }

  return new Promise((resolve, reject) => {
    let motDePasse = "";
    process.stdout.write("Mot de passe (8 caractères minimum) : ");
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const terminer = (erreur) => {
      process.stdin.off("data", recevoir);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (erreur) reject(erreur);
      else resolve(motDePasse);
    };

    const recevoir = (fragment) => {
      for (const caractere of fragment) {
        if (caractere === "\u0003") {
          terminer(new Error("Saisie annulée."));
          return;
        }
        if (caractere === "\r" || caractere === "\n") {
          terminer();
          return;
        }
        if (caractere === "\u007f" || caractere === "\b") {
          motDePasse = motDePasse.slice(0, -1);
        } else {
          motDePasse += caractere;
        }
      }
    };

    process.stdin.on("data", recevoir);
  });
}

const motDePasse = await lireMotDePasseMasque();
if (motDePasse.length < 8) {
  throw new Error("Le mot de passe doit faire au moins 8 caractères.");
}

const connection = await mysql.createConnection({
  ...config,
  port: Number(config.port),
  ssl:
    process.env.DB_SSL === "1" || process.env.TIDB_HOST
      ? { rejectUnauthorized: true }
      : undefined,
  charset: "utf8mb4",
});

try {
  const [[admin]] = await connection.query(
    "SELECT id FROM utilisateurs WHERE role = 'admin' LIMIT 1",
  );
  if (admin) {
    throw new Error("Un administrateur existe déjà ; aucun changement effectué.");
  }

  const [[existant]] = await connection.execute(
    "SELECT id FROM utilisateurs WHERE email = ? LIMIT 1",
    [email],
  );
  if (existant) {
    throw new Error("Cette adresse e-mail est déjà utilisée ; aucun changement effectué.");
  }

  await connection.execute(
    "INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, role) VALUES (?, ?, ?, 'admin')",
    ["Administration ArTova", email, await bcrypt.hash(motDePasse, 12)],
  );
  console.log(`Premier compte administrateur créé pour ${email}.`);
} finally {
  await connection.end();
}
