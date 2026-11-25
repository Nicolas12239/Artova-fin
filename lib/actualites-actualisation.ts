import { createHash } from "node:crypto";
import { execute } from "./db";

// Au plus une collecte toutes les 30 minutes, déclenchée par une visite (lecteur ou
// robot d'indexation) : l'actualité se met à jour en continu sans service externe.
// Le passage quotidien de Vercel Cron et le bouton de l'administration restent
// disponibles.
export const INTERVALLE_COLLECTE_MS = 30 * 60 * 1000;

const CLE = createHash("sha1").update("etat:collecte").digest("hex");

// Réserve le prochain passage : vrai pour un seul visiteur à la fois (mise à jour
// conditionnelle en base), faux si une collecte a eu lieu il y a moins de 30 minutes.
export async function reserverCollecte(): Promise<boolean> {
  // TIMESTAMP ne remonte pas avant 1970 : une date ancienne sert de valeur de départ.
  await execute("INSERT IGNORE INTO actualites_vues (empreinte, vu_le) VALUES (?, ?)", [
    CLE,
    new Date("2000-01-01T00:00:00Z"),
  ]);
  const r = await execute("UPDATE actualites_vues SET vu_le = ? WHERE empreinte = ? AND vu_le < ?", [
    new Date(),
    CLE,
    new Date(Date.now() - INTERVALLE_COLLECTE_MS),
  ]);
  return r.affectedRows > 0;
}
