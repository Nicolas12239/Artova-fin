import { execute, query, type Param } from "./db";
import {
  devinerCategorie,
  devinerPortee,
  empreinteTitre,
  empreinteUrl,
  imageDePage,
  lireFlux,
  parleArtsVisuels,
  parleCulture,
  telecharger,
  tronquer,
  type EntreeFlux,
} from "./actualites-flux";
import { enrichir, ErreurIAFatale, iaDisponible, type FicheIA, type PublicationBrute } from "./actualites-ia";
import type { Categorie } from "./actualites-commun";
import type { Portee } from "./actualites-sources";

export interface SourceActualite {
  id: number;
  nom: string;
  url_flux: string;
  portee: Portee;
  langue: string;
  filtrer: number;
  actif: number;
  derniere_collecte: Date | null;
  derniere_erreur: string | null;
  nb_articles: number;
}

export interface RapportCollecte {
  sources: number;
  lues: number;
  nouvelles: number;
  publiees: number;
  rejetees: number;
  reportees: number;
  ia: "active" | "absente" | "en_panne";
  erreurs: { source: string; message: string }[];
  duree_ms: number;
}

const AGE_MAX_JOURS = 7;
const MAX_PAR_SOURCE = 5;
const TAILLE_LOT_IA = 6;
const LOTS_SIMULTANES = 3;
const IMPORTANCE_MIN = 4;
const ORDRE_PORTEE: Record<Portee, number> = { togo: 0, afrique: 1, monde: 2 };

interface Candidat {
  cle: number;
  source: SourceActualite;
  entree: EntreeFlux;
  empreinte: string;
  date: Date;
}

interface Retenu {
  candidat: Candidat;
  titre: string;
  resume: string;
  categorie: Categorie;
  portee: Portee;
  importance: number;
  image: string | null;
}

function message(erreur: unknown): string {
  const texte = erreur instanceof Error ? erreur.message : String(erreur);
  return texte.slice(0, 240);
}

function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(",");
}

async function dejaVues(empreintes: string[]): Promise<Set<string>> {
  const vues = new Set<string>();
  for (let i = 0; i < empreintes.length; i += 150) {
    const lot = empreintes.slice(i, i + 150);
    const rows = await query<{ empreinte: string }>(
      `SELECT empreinte FROM actualites_vues WHERE empreinte IN (${placeholders(lot.length)})`,
      lot,
    );
    for (const r of rows) vues.add(r.empreinte);
  }
  return vues;
}

async function enParallele<T>(elements: T[], simultanes: number, tache: (element: T) => Promise<void>) {
  let suivant = 0;
  const ouvriers = Array.from({ length: Math.min(simultanes, elements.length) }, async () => {
    while (suivant < elements.length) {
      const element = elements[suivant++];
      await tache(element);
    }
  });
  await Promise.all(ouvriers);
}

// Collecte du jour : lit les flux, écarte ce qui est déjà connu ou hors sujet,
// fait rédiger les fiches par l'IA (si la clé est configurée), puis publie.
export async function collecterActualites({
  budgetMs = 50_000,
  limiteIA = Number(process.env.ACTUALITES_MAX_PAR_COLLECTE) || 40,
}: { budgetMs?: number; limiteIA?: number } = {}): Promise<RapportCollecte> {
  const debut = Date.now();
  const rapport: RapportCollecte = {
    sources: 0, lues: 0, nouvelles: 0, publiees: 0, rejetees: 0, reportees: 0,
    ia: iaDisponible() ? "active" : "absente", erreurs: [], duree_ms: 0,
  };

  const sources = await query<SourceActualite>(
    "SELECT * FROM sources_actualites WHERE actif = 1 ORDER BY id",
  );
  rapport.sources = sources.length;

  // 1. Lecture des flux, tous en même temps.
  const lectures = await Promise.all(
    sources.map(async (source) => {
      try {
        const entrees = lireFlux(await telecharger(source.url_flux, { delaiMs: 10_000 }));
        await execute(
          "UPDATE sources_actualites SET derniere_collecte = ?, derniere_erreur = NULL WHERE id = ?",
          [new Date(), source.id],
        );
        return { source, entrees };
      } catch (erreur) {
        const texte = message(erreur);
        rapport.erreurs.push({ source: source.nom, message: texte });
        await execute("UPDATE sources_actualites SET derniere_collecte = ?, derniere_erreur = ? WHERE id = ?", [
          new Date(), texte, source.id,
        ]);
        return { source, entrees: [] as EntreeFlux[] };
      }
    }),
  );

  // 2. Candidats récents et dans le sujet.
  const maintenant = Date.now();
  const toutes: Candidat[] = [];
  let cle = 0;
  for (const { source, entrees } of lectures) {
    rapport.lues += entrees.length;
    for (const entree of entrees) {
      const date = entree.date && entree.date.getTime() <= maintenant + 3_600_000 ? entree.date : new Date(maintenant);
      if (maintenant - date.getTime() > AGE_MAX_JOURS * 86_400_000) continue;
      if (source.filtrer) {
        // Presse togolaise : filtre large si l'IA trie ensuite, strict sinon.
        const large = source.portee === "togo" && rapport.ia === "active";
        const texte = `${entree.titre} ${entree.extrait}`;
        if (!(large ? parleCulture(texte) : parleArtsVisuels(texte))) continue;
      }
      toutes.push({ cle: cle++, source, entree, empreinte: empreinteUrl(entree.lien), date });
    }
  }

  const vues = await dejaVues(toutes.map((c) => c.empreinte));
  const titresRecents = new Set(
    (
      await query<{ titre: string }>(
        "SELECT titre FROM actualites WHERE publie_le >= ?",
        [new Date(maintenant - 14 * 86_400_000)],
      )
    ).map((r) => empreinteTitre(r.titre)),
  );

  const parSource = new Map<number, number>();
  const titresVus = new Set<string>();
  const nouveaux = toutes
    .filter((c) => !vues.has(c.empreinte))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .filter((c) => {
      const t = empreinteTitre(c.entree.titre);
      if (titresRecents.has(t) || titresVus.has(t)) return false;
      const n = parSource.get(c.source.id) ?? 0;
      if (n >= MAX_PAR_SOURCE) return false;
      parSource.set(c.source.id, n + 1);
      titresVus.add(t);
      return true;
    })
    // Le Togo d'abord, puis l'Afrique, puis le monde : si le plafond du jour
    // est atteint, ce sont les nouvelles étrangères qui attendent demain.
    .sort(
      (a, b) =>
        ORDRE_PORTEE[a.source.portee] - ORDRE_PORTEE[b.source.portee] || b.date.getTime() - a.date.getTime(),
    );

  rapport.nouvelles = nouveaux.length;
  const aTraiter = nouveaux.slice(0, limiteIA);
  rapport.reportees = nouveaux.length - aTraiter.length;

  // 3. Rédaction et tri par l'IA, par petits lots en parallèle.
  const fiches = new Map<number, FicheIA>();
  const differes = new Set<number>();
  if (rapport.ia === "active" && aTraiter.length > 0) {
    const lots: Candidat[][] = [];
    for (let i = 0; i < aTraiter.length; i += TAILLE_LOT_IA) lots.push(aTraiter.slice(i, i + TAILLE_LOT_IA));
    await enParallele(lots, LOTS_SIMULTANES, async (lot) => {
      // Clé refusée : le reste de la collecte se fait sans IA (voir plus bas).
      if (rapport.ia === "en_panne") return;
      if (Date.now() - debut > budgetMs - 15_000) {
        for (const c of lot) differes.add(c.cle);
        return;
      }
      const brutes: PublicationBrute[] = lot.map((c) => ({
        id: c.cle,
        source: c.source.nom,
        langue: c.source.langue,
        titre: c.entree.titre,
        extrait: c.entree.extrait,
      }));
      try {
        const resultat = await enrichir(brutes);
        for (const c of lot) {
          const fiche = resultat.get(c.cle);
          if (fiche) fiches.set(c.cle, fiche);
          else differes.add(c.cle);
        }
      } catch (erreur) {
        if (erreur instanceof ErreurIAFatale) {
          rapport.ia = "en_panne";
          rapport.erreurs.push({ source: "IA", message: message(erreur) });
          // Les lots restants basculent en mode sans IA ; celui-ci aussi.
          return;
        }
        rapport.erreurs.push({ source: "IA", message: message(erreur) });
        for (const c of lot) differes.add(c.cle);
      }
    });
  }

  // 4. Décision : publier, écarter, ou reporter à la prochaine collecte.
  const retenus: Retenu[] = [];
  const traites: string[] = [];
  for (const candidat of aTraiter) {
    if (differes.has(candidat.cle)) {
      rapport.reportees++;
      continue;
    }
    const fiche = fiches.get(candidat.cle);
    const { entree, source } = candidat;
    if (fiche) {
      traites.push(candidat.empreinte);
      if (!fiche.pertinent || fiche.importance < IMPORTANCE_MIN) {
        rapport.rejetees++;
        continue;
      }
      retenus.push({
        candidat, titre: fiche.titre, resume: fiche.resume, categorie: fiche.categorie,
        portee: fiche.portee, importance: fiche.importance, image: entree.image,
      });
      continue;
    }
    // Sans IA : titre et extrait d'origine, classement par mots-clés.
    const texte = `${entree.titre} ${entree.extrait}`;
    const portee = devinerPortee(texte, source.portee);
    traites.push(candidat.empreinte);
    retenus.push({
      candidat,
      titre: tronquer(entree.titre, 140),
      resume: entree.extrait.length >= 30 ? tronquer(entree.extrait, 280) : `À lire sur ${source.nom}.`,
      categorie: devinerCategorie(texte),
      portee,
      importance: portee === "togo" ? 7 : portee === "afrique" ? 6 : 5,
      image: entree.image,
    });
  }

  // 5. Couvertures manquantes : image Open Graph de l'article.
  await enParallele(
    retenus.filter((r) => !r.image),
    6,
    async (r) => {
      if (Date.now() - debut > budgetMs - 5_000) return;
      r.image = await imageDePage(r.candidat.entree.lien);
    },
  );

  // 6. Publication.
  for (const r of retenus) {
    const ajout = await execute(
      `INSERT IGNORE INTO actualites
       (empreinte, titre, resume, url_source, source_nom, image_url, portee, categorie, importance, origine, source_id, publie_le)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'auto', ?, ?)`,
      [
        r.candidat.empreinte, r.titre, r.resume, r.candidat.entree.lien, r.candidat.source.nom,
        r.image, r.portee, r.categorie, r.importance, r.candidat.source.id, r.candidat.date,
      ],
    );
    if (ajout.affectedRows > 0) rapport.publiees++;
  }

  for (let i = 0; i < traites.length; i += 100) {
    const lot = traites.slice(i, i + 100);
    await execute(
      `INSERT IGNORE INTO actualites_vues (empreinte) VALUES ${lot.map(() => "(?)").join(",")}`,
      lot as Param[],
    );
  }

  await execute(
    "UPDATE sources_actualites s SET nb_articles = (SELECT COUNT(*) FROM actualites a WHERE a.source_id = s.id)",
  );
  await execute("DELETE FROM actualites_vues WHERE vu_le < ?", [new Date(maintenant - 90 * 86_400_000)]);

  rapport.duree_ms = Date.now() - debut;
  return rapport;
}
