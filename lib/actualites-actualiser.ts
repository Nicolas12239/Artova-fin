import { collecterActualites } from "./actualites-collecte";
import { reserverCollecte } from "./actualites-actualisation";

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
