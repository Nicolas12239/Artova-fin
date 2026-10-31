import { readFileSync } from "node:fs";
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

const connection = await mysql.createConnection({
  ...config,
  port: Number(config.port),
  ssl:
    process.env.DB_SSL === "1" || process.env.TIDB_HOST
      ? { rejectUnauthorized: true }
      : undefined,
  multipleStatements: true,
  charset: "utf8mb4",
});

try {
  const sql = readFileSync(new URL("../db/bootstrap.sql", import.meta.url), "utf8");
  await connection.query(sql);

  const [tables] = await connection.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('utilisateurs', 'artistes', 'oeuvres', 'commandes', 'fichiers', 'inscrits')
     ORDER BY TABLE_NAME`,
    [config.database],
  );
  const names = tables.map((table) => table.TABLE_NAME);
  const expected = ["artistes", "commandes", "fichiers", "inscrits", "oeuvres", "utilisateurs"];
  const missingTables = expected.filter((name) => !names.includes(name));
  if (missingTables.length > 0) {
    throw new Error(`Initialisation incomplète. Objets absents : ${missingTables.join(", ")}`);
  }

  console.log(`Base « ${config.database} » initialisée. Les tables et la vue sont prêtes.`);
} finally {
  await connection.end();
}
