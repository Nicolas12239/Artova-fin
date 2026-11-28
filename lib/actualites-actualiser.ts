import { collecterActualites } from "./actualites-collecte";
import { reserverCollecte, reserverEnquete } from "./actualites-actualisation";
import { iaDisponible } from "./actualites-ia";
import { candidatsEnquete, enqueterActualite, reclamerEnquete } from "./actualites-recherche";
import { collecterReseaux } from "./actualites-social";
import { renvoyerEnAttente } from "./notifications";

// À appeler depuis `after()` d'une page publique : lance la collecte si la dernière
// date de plus de 30 minutes. Ne lève jamais d'erreur (le lecteur n'est pas concerné).
export async function actualiserSiBesoin(): Promise<void> {
  try {
    if (await reserverCollecte()) {
      // Au passage, les alertes restées en attente (ntfy saturé) repartent.
      await renvoyerEnAttente(3).catch(() => 0);
      // Presse et réseaux sociaux en même temps : l'un en panne n'arrête pas l'autre.
      const [presse, reseaux] = await Promise.allSettled([
        collecterActualites({ budgetMs: 52_000 }),
        collecterReseaux({ budgetMs: 45_000 }),
      ]);
      const n = (presse.status === "fulfilled" ? presse.value.publiees : 0) + (reseaux.status === "fulfilled" ? reseaux.value.publiees : 0);
      if (n > 0) console.info(`[ArTova] Actualités : ${n} nouvelle(s) publication(s).`);
      for (const r of [presse, reseaux]) if (r.status === "rejected") console.error("[ArTova] Collecte :", r.reason);
    }
  } catch (erreur) {
    console.error("[ArTova] Actualisation automatique des actualités :", erreur);
  }
}

// Enquête automatique : documente (noms, rôles, photos, vidéos) les articles qui ne
// l'ont pas encore été. Avec l'IA, un article par passage ; sans clé, seuls les
// portraits libres de droits sont cherchés, donc plusieurs articles à la fois.
// `prioritaire` : l'article que le visiteur est en train de lire.
export async function enqueterSiBesoin(prioritaire?: number): Promise<void> {
  try {
    if (!(await reserverEnquete())) return;
    const budget = 50_000;
    const debut = Date.now();
    const ids = prioritaire ? [prioritaire] : await candidatsEnquete(iaDisponible() ? 1 : 4);
    for (const id of ids) {
      const reste = budget - (Date.now() - debut);
      if (reste < 12_000) break;
      if (!(await reclamerEnquete(id))) continue;
      const r = await enqueterActualite(id, { budgetMs: reste });
      if (r) console.info(`[ArTova] Enquête #${id} (${r.mode}) : ${r.personnes} personne(s), ${r.photos} photo(s), ${r.videos} vidéo(s).`);
    }
  } catch (erreur) {
    console.error("[ArTova] Enquête automatique :", erreur);
  }
}
