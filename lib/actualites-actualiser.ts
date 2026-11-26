import { collecterActualites } from "./actualites-collecte";
import { reserverCollecte, reserverEnquete } from "./actualites-actualisation";
import { iaDisponible } from "./actualites-ia";
import { candidatsEnquete, enqueterActualite, reclamerEnquete } from "./actualites-recherche";

// À appeler depuis `after()` d'une page publique : lance la collecte si la dernière
// date de plus de 30 minutes. Ne lève jamais d'erreur (le lecteur n'est pas concerné).
export async function actualiserSiBesoin(): Promise<void> {
  try {
    if (await reserverCollecte()) {
      const r = await collecterActualites({ budgetMs: 55_000 });
      if (r.publiees > 0) console.info(`[ArTova] Actualités : ${r.publiees} nouvelle(s) publication(s).`);
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
