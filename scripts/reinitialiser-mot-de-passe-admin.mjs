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
const email = (await terminal.question("E-mail du compte administrateur à réinitialiser : "))
  .trim()
  .toLowerCase();
terminal.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Adresse e-mail invalide.");
}

function demanderMotDePasseMasque(libelle) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Lancez cette commande depuis un terminal interactif pour saisir le mot de passe sans l'afficher.");
  }

  return new Promise((resolve, reject) => {
    let motDePasse = "";
    process.stdout.write(libelle);
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
  const [admins] = await connection.execute(
    "SELECT id FROM utilisateurs WHERE email = ? AND role = 'admin' LIMIT 1",
    [email],
  );
  const admin = admins[0];
  if (!admin) {
    throw new Error("Aucun compte administrateur ne correspond à cette adresse ; aucun changement effectué.");
  }

  const confirmation = createInterface({ input: process.stdin, output: process.stdout });
  const accord = await confirmation.question(
    `Pour confirmer la réinitialisation du compte ${email}, tapez REINITIALISER : `,
  );
  confirmation.close();
  if (accord !== "REINITIALISER") {
    throw new Error("Confirmation incorrecte ; aucun changement effectué.");
  }

  const motDePasse = await demanderMotDePasseMasque("Nouveau mot de passe (12 caractères minimum) : ");
  const confirmationMotDePasse = await demanderMotDePasseMasque(
    "Confirmez le nouveau mot de passe : ",
  );
  if (motDePasse.length < 12) {
    throw new Error("Le mot de passe doit faire au moins 12 caractères ; aucun changement effectué.");
  }
  if (motDePasse !== confirmationMotDePasse) {
    throw new Error("Les mots de passe ne correspondent pas ; aucun changement effectué.");
  }

  const [result] = await connection.execute(
    "UPDATE utilisateurs SET mot_de_passe_hash = ? WHERE id = ? AND role = 'admin'",
    [await bcrypt.hash(motDePasse, 12), admin.id],
  );
  if (result.affectedRows !== 1) {
    throw new Error("La mise à jour du compte administrateur a échoué.");
  }
  console.log(`Mot de passe réinitialisé pour ${email}.`);
} finally {
  await connection.end();
}
