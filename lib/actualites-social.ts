import { execute, poserTags, query, type Param } from "./db";
import { artisteCorrespondant } from "./actualites-collecte";
import { devinerCategorie, devinerPortee, empreinteUrl, normaliser, parleArtsVisuels, adresseSure, tronquer } from "./actualites-flux";
import { ecrireMotsCles, extraireDates, extraireMotsCles } from "./actualites-motscles";
import {
  connexions,
  infosLien,
  lireFacebook,
  lireHashtag,
  lireInstagram,
  lireYouTube,
  NOMS_PLATEFORMES,
  type PublicationSociale,
} from "./actualites-social-lecture";
import { saveUpload } from "./upload";
import type { Portee } from "./actualites-sources";

// Les publications des réseaux sociaux deviennent des articles : titre, texte
// d'origine, photos, publication intégrée (vidéo comprise), personnes reconnues,
// mots retenus et, quand la légende annonce une date, rendez-vous à l'agenda.

const AGE_MAX_JOURS = 14;
const PAR_SOURCE = 12;

export type PlateformeSuivie = "instagram" | "instagram_hashtag" | "facebook" | "youtube";

export interface SourceSociale {
  id: number;
  plateforme: PlateformeSuivie;
  identifiant: string;
  nom: string;
  portee: Portee;
  filtrer: number;
  actif: number;
  derniere_collecte: Date | null;
  derniere_erreur: string | null;
  nb_publications: number;
}

export interface RapportReseaux {
  sources: number;
  lues: number;
  publiees: number;
  // Comptes qui attendent la connexion à Meta.
  enAttente: number;
  erreurs: { source: string; message: string }[];
}

const sansDieses = (t: string) =>
  t.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/[ \t]+/g, " ").trim();

export function titreDe(p: PublicationSociale): string {
  if (p.titre) return tronquer(p.titre, 140);
  const ligne = p.texte.split(/\n+/).map(sansDieses).find((l) => l.length >= 12);
  if (ligne) {
    const phrase = /^.{20,}?[.!?…](?=\s|$)/.exec(ligne)?.[0] ?? ligne;
    return tronquer(phrase.replace(/[.\s]+$/, ""), 120);
  }
  return `Nouvelle publication de ${p.compte || "un compte suivi"} sur ${NOMS_PLATEFORMES[p.plateforme]}`;
}

interface NomConnu {
  nom: string;
  cle: string;
  slug: string | null;
}

// Personnes déjà connues d'ArTova (citées dans des articles, ou artistes inscrits) :
// une publication qui les nomme leur est rattachée.
async function nomsConnus(): Promise<NomConnu[]> {
  const artistes = (
    await query<{ slug: string; nom: string }>("SELECT slug, nom FROM artistes WHERE statut = 'publie'").catch(() => [])
  ).map((x) => ({ ...x, mots: normaliser(x.nom).split(" ").filter(Boolean) }));
  const cites = await query<{ nom: string }>("SELECT MIN(nom) AS nom FROM actualites_tags GROUP BY slug LIMIT 1500").catch(() => []);
  const vus = new Set<string>();
  return [...artistes.map((a) => a.nom), ...cites.map((c) => c.nom)].flatMap((nom) => {
    const cle = normaliser(nom);
    // Un seul mot court (« Laka ») donnerait trop de faux rapprochements.
    if (vus.has(cle) || (!cle.includes(" ") && cle.length < 6)) return [];
    vus.add(cle);
    return [{ nom, cle: ` ${cle} `, slug: artisteCorrespondant(nom, artistes) }];
  });
}

export type ResultatPublication = { statut: "publie" | "existe" | "ecarte"; id?: number; titre: string };

async function publier(
  p: PublicationSociale,
  { portee, manuel, connus }: { portee: Portee; manuel: boolean; connus: NomConnu[] },
): Promise<ResultatPublication> {
  const empreinte = empreinteUrl(p.url);
  const titre = titreDe(p);
  const existant = await query<{ id: number }>("SELECT id FROM actualites WHERE empreinte = ? LIMIT 1", [empreinte]);
  if (existant[0]) {
    // Les adresses d'images d'Instagram expirent : on les rafraîchit au passage.
    if (p.image && p.plateforme.startsWith("instagram")) {
      await execute("UPDATE actualites SET image_url = ?, images = ? WHERE id = ? AND source_nom LIKE '%Instagram'", [
        p.image, p.images.join("\n") || null, existant[0].id,
      ]);
    }
    return { statut: "existe", id: existant[0].id, titre };
  }
  // Un article supprimé par l'administration ne revient pas automatiquement.
  if (!manuel) {
    const vu = await query<{ n: number }>("SELECT 1 AS n FROM actualites_vues WHERE empreinte = ? LIMIT 1", [empreinte]);
    if (vu.length > 0) return { statut: "ecarte", titre };
  }

  const texte = p.texte.slice(0, 5000);
  const ensemble = `${p.titre}\n${texte}`;
  const contenu = texte.split(/\n+/).map((l) => l.trim()).filter(Boolean).join("\n\n") || null;
  const sobre = sansDieses(texte).replace(/\s+/g, " ");
  const resume = sobre.length >= 30 ? tronquer(sobre, 280) : titre;
  const mots = extraireMotsCles(ensemble);
  const normalise = ` ${normaliser(ensemble)} `;
  const personnes = connus.filter((c) => normalise.includes(c.cle)).slice(0, 12).map((c) => ({ nom: c.nom, slug: c.slug }));
  const rendezVous = mots.some((m) => ["vernissage", "exposition", "festival", "atelier", "performance", "biennale"].includes(m))
    ? extraireDates(ensemble, p.date)
    : null;
  const zone = devinerPortee(ensemble, portee);
  const source = `${p.compte || NOMS_PLATEFORMES[p.plateforme]} · ${NOMS_PLATEFORMES[p.plateforme]}`.slice(0, 120);
  const json = personnes.length > 0 ? JSON.stringify(personnes) : null;

  const valeurs: Param[] = [
    empreinte, titre, resume, contenu, p.url, source, p.image, p.image ? source.slice(0, 160) : null,
    p.images.join("\n") || null, p.url, json, personnes.find((x) => x.slug)?.slug ?? null,
    rendezVous?.debut ?? null, rendezVous?.fin ?? null, zone,
    devinerCategorie(ensemble), manuel ? 7 : zone === "togo" ? 6 : 5, manuel ? "manuel" : "auto", p.date,
    ecrireMotsCles(mots) ?? "",
  ];
  const ajout = await execute(
    `INSERT IGNORE INTO actualites
     (empreinte, titre, resume, contenu, url_source, source_nom, image_url, credit_image, images, videos, personnes,
      artiste_slug, evenement_debut, evenement_fin, portee, categorie, importance, origine, publie_le, mots_cles)
     VALUES (${valeurs.map(() => "?").join(", ")})`,
    valeurs,
  );
  if (ajout.affectedRows === 0) return { statut: "existe", titre };
  const id = Number(ajout.insertId);
  if (json && id) await poserTags(id, json);
  await execute("INSERT IGNORE INTO actualites_vues (empreinte) VALUES (?)", [empreinte]);
  return { statut: "publie", id, titre };
}

async function lire(s: SourceSociale): Promise<PublicationSociale[]> {
  if (s.plateforme === "instagram") return lireInstagram(s.identifiant);
  if (s.plateforme === "instagram_hashtag") return lireHashtag(s.identifiant);
  if (s.plateforme === "facebook") return lireFacebook(s.identifiant, s.nom);
  return lireYouTube(s.identifiant, s.nom);
}

export async function collecterReseaux({ budgetMs = 45_000 }: { budgetMs?: number } = {}): Promise<RapportReseaux> {
  const debut = Date.now();
  const sources = await query<SourceSociale>(
    "SELECT * FROM sources_sociales WHERE actif = 1 ORDER BY derniere_collecte IS NOT NULL, derniere_collecte ASC LIMIT 60",
  );
  const rapport: RapportReseaux = { sources: sources.length, lues: 0, publiees: 0, enAttente: 0, erreurs: [] };
  const acces = connexions();
  const pretes = sources.filter((s) => {
    const ok = s.plateforme.startsWith("instagram") ? acces.instagram : s.plateforme === "facebook" ? acces.facebook : true;
    if (!ok) rapport.enAttente++;
    return ok;
  });
  if (pretes.length === 0) return rapport;
  const connus = await nomsConnus();

  for (let i = 0; i < pretes.length && Date.now() - debut < budgetMs - 14_000; i += 4) {
    await Promise.all(
      pretes.slice(i, i + 4).map(async (s) => {
        try {
          const recentes = (await lire(s))
            .filter((p) => Date.now() - p.date.getTime() <= AGE_MAX_JOURS * 86_400_000)
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, PAR_SOURCE);
          rapport.lues += recentes.length;
          let publiees = 0;
          for (const p of recentes) {
            if (Date.now() - debut > budgetMs) break;
            if (s.filtrer && !parleArtsVisuels(`${p.titre} ${p.texte}`)) continue;
            if ((await publier(p, { portee: s.portee, manuel: false, connus })).statut === "publie") publiees++;
          }
          rapport.publiees += publiees;
          await execute(
            "UPDATE sources_sociales SET derniere_collecte = ?, derniere_erreur = NULL, nb_publications = nb_publications + ? WHERE id = ?",
            [new Date(), publiees, s.id],
          );
        } catch (erreur) {
          const message = (erreur instanceof Error ? erreur.message : String(erreur)).slice(0, 240);
          rapport.erreurs.push({ source: s.nom, message });
          await execute("UPDATE sources_sociales SET derniere_collecte = ?, derniere_erreur = ? WHERE id = ?", [new Date(), message, s.id]);
        }
      }),
    );
  }
  return rapport;
}

// La vignette de TikTok expire en quelques heures : ArTova en garde une copie
// pour illustrer la publication que l'administration a choisi de reprendre.
async function copierImage(url: string): Promise<string | null> {
  const cible = adresseSure(url);
  if (!cible) return null;
  try {
    const res = await fetch(cible, { signal: AbortSignal.timeout(10_000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const octets = await res.arrayBuffer();
    if (octets.byteLength > 8_000_000) return null;
    return await saveUpload(new File([octets], "vignette.jpg", { type }), "actualite");
  } catch {
    return null;
  }
}

// Ajoute une publication à partir de son lien (collé par l'administration ou reçu
// par le bouton « Partager » du téléphone).
export async function importerLien(
  lien: string,
  { texte = "", portee = "togo" }: { texte?: string; portee?: Portee } = {},
): Promise<ResultatPublication | { statut: "invalide"; titre: string }> {
  const infos = await infosLien(lien);
  if (!infos) return { statut: "invalide", titre: lien.slice(0, 120) };
  const image = infos.image ? (infos.plateforme === "tiktok" ? await copierImage(infos.image) : infos.image) : null;
  return publier(
    {
      plateforme: infos.plateforme,
      compte: infos.compte,
      url: infos.url,
      titre: "",
      texte: texte.trim() || infos.texte,
      image,
      images: [],
      date: new Date(),
    },
    { portee, manuel: true, connus: await nomsConnus() },
  );
}
