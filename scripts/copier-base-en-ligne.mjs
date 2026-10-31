// Copie la base du site en ligne (Railway) dans la base XAMPP locale « artova »
// pour la consulter dans phpMyAdmin (table « inscrits » notamment).
//
// Utilisation (XAMPP / MySQL démarré) :
//   node scripts/copier-base-en-ligne.mjs            données sans les images
//   node scripts/copier-base-en-ligne.mjs --images   avec les images (plus long)
//
// La lecture passe par « railway ssh » (connexion sécurisée déjà configurée) :
// la base en ligne n'est jamais exposée sur Internet. La copie locale est
// remplacée à chaque exécution ; le site en ligne n'est jamais modifié.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const avecImages = process.argv.includes("--images");
const TABLES = ["utilisateurs", "artistes", "oeuvres", "commandes", ...(avecImages ? ["fichiers"] : [])];

// --- 1. Lecture côté serveur Railway --------------------------------------
const scriptDistant = `
const m = require("mysql2/promise");
(async () => {
  const c = await m.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    charset: "utf8mb4", dateStrings: true });
  const sortie = { tables: {}, vues: {} };
  for (const t of ${JSON.stringify(TABLES)}) {
    const [[def]] = await c.query("SHOW CREATE TABLE \`" + t + "\`");
    const [lignes] = await c.query("SELECT * FROM \`" + t + "\`");
    sortie.tables[t] = { creation: def["Create Table"], lignes: lignes.map((l) => {
      for (const k in l) if (Buffer.isBuffer(l[k])) l[k] = { b64: l[k].toString("base64") };
      return l; }) };
  }
  const [[vue]] = await c.query("SHOW CREATE VIEW inscrits");
  sortie.vues.inscrits = vue["Create View"];
  process.stdout.write("@@ARTOVA@@" + JSON.stringify(sortie) + "@@FIN@@");
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });`;

console.log("Lecture de la base en ligne via Railway…");
const brut = execFileSync(
  "railway",
  [
    "ssh", "--service", "artova-fin", "--",
    "sh", "-c", `node -e "$(echo ${Buffer.from(scriptDistant).toString("base64")} | base64 -d)"`,
  ],
  { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"] },
);
const debut = brut.indexOf("@@ARTOVA@@");
const fin = brut.lastIndexOf("@@FIN@@");
if (debut < 0 || fin < 0) throw new Error("Réponse inattendue de Railway.");
const donnees = JSON.parse(brut.slice(debut + "@@ARTOVA@@".length, fin));

// --- 2. Écriture dans la base XAMPP locale ---------------------------------
function lireEnv() {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2]]),
    );
  } catch {
    return {};
  }
}
const env = { ...lireEnv(), ...process.env };
const local = await mysql.createConnection({
  host: env.LOCAL_DB_HOST || env.DB_HOST || "127.0.0.1",
  port: Number(env.LOCAL_DB_PORT || env.DB_PORT || 3306),
  user: env.LOCAL_DB_USER || env.DB_USER || "root",
  password: env.LOCAL_DB_PASSWORD ?? env.DB_PASSWORD ?? "",
  charset: "utf8mb4",
  multipleStatements: true,
});
const base = env.LOCAL_DB_NAME || env.DB_NAME || "artova";
await local.query(`CREATE DATABASE IF NOT EXISTS \`${base}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await local.query(`USE \`${base}\``);

// MySQL 9 (Railway) -> MariaDB 10.4 (XAMPP) : collations et commentaires
// conditionnels que MariaDB ne comprend pas.
const adapter = (sql) =>
  sql
    .replace(/\/\*!\d+\s[^*]*\*\//g, "")
    .replace(/utf8mb4_0900_ai_ci|utf8mb4_0900_as_cs/g, "utf8mb4_unicode_ci")
    .replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, "")
    .replace(/SQL SECURITY DEFINER\s*/g, "");

await local.query("SET FOREIGN_KEY_CHECKS = 0");
await local.query("DROP VIEW IF EXISTS inscrits");
for (const t of [...TABLES].reverse()) await local.query(`DROP TABLE IF EXISTS \`${t}\``);
for (const t of TABLES) {
  const { creation, lignes } = donnees.tables[t];
  await local.query(adapter(creation));
  for (let i = 0; i < lignes.length; i += 200) {
    const lot = lignes.slice(i, i + 200);
    const colonnes = Object.keys(lot[0]);
    const valeurs = lot.map((l) =>
      colonnes.map((c) => (l[c] && typeof l[c] === "object" && "b64" in l[c] ? Buffer.from(l[c].b64, "base64") : l[c])),
    );
    await local.query(`INSERT INTO \`${t}\` (${colonnes.map((c) => `\`${c}\``).join(",")}) VALUES ?`, [valeurs]);
  }
  console.log(`  ${t.padEnd(14)} ${lignes.length} ligne(s)`);
}
await local.query(adapter(donnees.vues.inscrits));
await local.query("SET FOREIGN_KEY_CHECKS = 1");

const [resume] = await local.query("SELECT statut, COUNT(*) AS nb FROM inscrits GROUP BY statut");
console.log(`\nCopie terminée dans la base locale « ${base} » :`);
for (const r of resume) console.log(`  ${r.statut} : ${r.nb}`);
console.log(`Ouvrez phpMyAdmin > ${base} > inscrits.`);
await local.end();
