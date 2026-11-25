import { execute, query, type Param } from "./db";
import {
  devinerCategorie,
  devinerPortee,
  empreinteTitre,
  empreinteUrl,
  lireFlux,
  lirePageArticle,
  normaliser,
  parleArtsVisuels,
  parleCulture,
  telecharger,
  tronquer,
  type EntreeFlux,
  type PageArticle,
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
  // Parmi les publiées : avec un rendez-vous daté, une vidéo, plusieurs photos.
  evenements: number;
  videos: number;
  rejetees: number;
  reportees: number;
  ia: "active" | "absente" | "en_panne";
  erreurs: { source: string; message: string }[];
  duree_ms: number;
}

const AGE_MAX_JOURS = 7;
const MAX_PAR_SOURCE = 5;
// Deux publications par appel : chaque fiche contient un article développé et
// ses traductions, donc beaucoup de texte à produire.
const TAILLE_LOT_IA = 2;
const LOTS_SIMULTANES = 3;
// Publications analysées par l'IA à chaque passage : la collecte est lancée au plus
// toutes les 30 minutes, le reste attend le passage suivant.
const PAR_PASSAGE_IA = 6;
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
  // Article développé (IA), photos supplémentaires, vidéos, personnes citées.
  contenu: string | null;
  images: string | null;
  videos: string | null;
  personnes: string | null;
  artisteSlug: string | null;
  evenement: { debut: string; fin: string | null; lieu: string | null } | null;
  // JSON { en: {titre, resume, contenu}, de: … } quand l'IA a traduit.
  traductions: string | null;
}

// Rapproche un nom cité d'un artiste de la plateforme : mêmes mots, ou nom court
// (au moins deux mots) contenu dans le nom complet.
function artisteCorrespondant(nom: string, artistes: { slug: string; nom: string; mots: string[] }[]): string | null {
  const mots = normaliser(nom).split(" ").filter(Boolean);
  if (mots.length === 0) return null;
  for (const a of artistes) {
    if (a.mots.join(" ") === mots.join(" ")) return a.slug;
    const [court, long] = mots.length <= a.mots.length ? [mots, a.mots] : [a.mots, mots];
    if (court.length >= 2 && court.every((m) => long.includes(m))) return a.slug;
  }
  return null;
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
  limiteIA = Number(process.env.ACTUALITES_MAX_PAR_COLLECTE) || (iaDisponible() ? PAR_PASSAGE_IA : 40),
}: { budgetMs?: number; limiteIA?: number } = {}): Promise<RapportCollecte> {
  const debut = Date.now();
  const rapport: RapportCollecte = {
    sources: 0, lues: 0, nouvelles: 0, publiees: 0, evenements: 0, videos: 0, rejetees: 0, reportees: 0,
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

  // 2b. Lecture de la page de chaque article : texte, photos et vidéos.
  const pages = new Map<number, PageArticle>();
  await enParallele(aTraiter, 8, async (c) => {
    if (Date.now() - debut > budgetMs - 30_000) return;
    const page = await lirePageArticle(c.entree.lien);
    if (page) pages.set(c.cle, page);
  });

  // 3. Rédaction et tri par l'IA, par petits lots en parallèle.
  const fiches = new Map<number, FicheIA>();
  const differes = new Set<number>();
  if (rapport.ia === "active" && aTraiter.length > 0) {
    const lots: Candidat[][] = [];
    for (let i = 0; i < aTraiter.length; i += TAILLE_LOT_IA) lots.push(aTraiter.slice(i, i + TAILLE_LOT_IA));
    await enParallele(lots, LOTS_SIMULTANES, async (lot) => {
      // Clé refusée : le reste de la collecte se fait sans IA (voir plus bas).
      if (rapport.ia === "en_panne") return;
      if (Date.now() - debut > budgetMs - 20_000) {
        for (const c of lot) differes.add(c.cle);
        return;
      }
      const brutes: PublicationBrute[] = lot.map((c) => ({
        id: c.cle,
        source: c.source.nom,
        langue: c.source.langue,
        titre: c.entree.titre,
        extrait: c.entree.extrait,
        texte: pages.get(c.cle)?.texte ?? "",
        date: c.date.toISOString().slice(0, 10),
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
  const artistes = (
    await query<{ slug: string; nom: string }>("SELECT slug, nom FROM artistes WHERE statut = 'publie'").catch(() => [])
  ).map((x) => ({ ...x, mots: normaliser(x.nom).split(" ").filter(Boolean) }));

  // Photos supplémentaires de l'article (hors couverture) et vidéos trouvées dans la page.
  const medias = (c: Candidat, couverture: string | null) => {
    const page = pages.get(c.cle);
    const cle = (u: string) => u.replace(/[?#].*$/, "").replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, "");
    const images = (page?.images ?? []).filter((u) => !couverture || cle(u) !== cle(couverture)).slice(0, 5);
    return {
      images: images.length > 0 ? images.join("\n") : null,
      videos: page && page.videos.length > 0 ? page.videos.join("\n") : null,
    };
  };

  const retenus: Retenu[] = [];
  const traites: string[] = [];
  for (const candidat of aTraiter) {
    if (differes.has(candidat.cle)) {
      rapport.reportees++;
      continue;
    }
    const fiche = fiches.get(candidat.cle);
    const { entree, source } = candidat;
    const page = pages.get(candidat.cle);
    const couverture = entree.image ?? page?.couverture ?? page?.images[0] ?? null;
    if (fiche) {
      traites.push(candidat.empreinte);
      if (!fiche.pertinent || fiche.importance < IMPORTANCE_MIN) {
        rapport.rejetees++;
        continue;
      }
      const personnes = fiche.noms.map((nom) => ({ nom, slug: artisteCorrespondant(nom, artistes) }));
      retenus.push({
        candidat, titre: fiche.titre, resume: fiche.resume, categorie: fiche.categorie,
        portee: fiche.portee, importance: fiche.importance, image: couverture,
        contenu: fiche.article !== fiche.resume ? fiche.article : null,
        ...medias(candidat, couverture),
        personnes: personnes.length > 0 ? JSON.stringify(personnes) : null,
        artisteSlug: personnes.find((p) => p.slug)?.slug ?? null,
        evenement: fiche.evenement,
        traductions: JSON.stringify({
          en: { titre: fiche.traductions.en.titre, resume: fiche.traductions.en.resume, contenu: fiche.traductions.en.article },
          de: { titre: fiche.traductions.de.titre, resume: fiche.traductions.de.resume, contenu: fiche.traductions.de.article },
        }),
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
      image: couverture,
      contenu: null,
      ...medias(candidat, couverture),
      personnes: null,
      artisteSlug: null,
      evenement: null,
      // Média anglophone sans IA : son texte d'origine sert de version anglaise.
      traductions:
        source.langue === "en"
          ? JSON.stringify({ en: { titre: tronquer(entree.titre, 140), resume: entree.extrait.length >= 30 ? tronquer(entree.extrait, 280) : "" } })
          : null,
    });
  }

  // 6. Publication.
  for (const r of retenus) {
    const ajout = await execute(
      `INSERT IGNORE INTO actualites
       (empreinte, titre, resume, contenu, url_source, source_nom, image_url, credit_image, images, videos, personnes,
        artiste_slug, evenement_debut, evenement_fin, lieu, portee, categorie, importance, origine, source_id, publie_le, traductions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'auto', ?, ?, ?)`,
      [
        r.candidat.empreinte, r.titre, r.resume, r.contenu, r.candidat.entree.lien, r.candidat.source.nom,
        r.image, r.image || r.images ? r.candidat.source.nom : null, r.images, r.videos, r.personnes,
        r.artisteSlug, r.evenement?.debut ?? null, r.evenement?.fin ?? null, r.evenement?.lieu ?? null,
        r.portee, r.categorie, r.importance, r.candidat.source.id, r.candidat.date, r.traductions,
      ],
    );
    if (ajout.affectedRows > 0) {
      rapport.publiees++;
      if (r.evenement) rapport.evenements++;
      if (r.videos) rapport.videos++;
    }
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
