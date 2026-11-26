// Types, libellés et formats partagés par le serveur et les composants du
// navigateur : ce fichier ne doit jamais importer la base de données.
import type { Portee } from "./actualites-sources";
import { LOCALES, TEXTES, fmt, type Langue } from "./actualites-i18n";

export type { Portee };

export const LIBELLE_PORTEE: Record<Portee, string> = {
  togo: "Togo",
  afrique: "Afrique",
  monde: "Monde",
};

export const CATEGORIES = {
  expositions: "Expositions",
  marche: "Marché de l'art",
  artistes: "Artistes",
  evenements: "Événements",
  institutions: "Musées et galeries",
  patrimoine: "Patrimoine",
  creation: "Création",
  decouverte: "Découvertes",
  general: "Actualité",
} as const;

export type Categorie = keyof typeof CATEGORIES;

export function estCategorie(valeur: unknown): valeur is Categorie {
  return typeof valeur === "string" && Object.hasOwn(CATEGORIES, valeur);
}

export function estPortee(valeur: unknown): valeur is Portee {
  return valeur === "togo" || valeur === "afrique" || valeur === "monde";
}

export interface Actualite {
  id: number;
  titre: string;
  resume: string;
  contenu: string | null;
  url_source: string | null;
  source_nom: string;
  image_url: string | null;
  portee: Portee;
  categorie: Categorie;
  importance: number;
  a_la_une: number;
  statut: "publie" | "masque";
  origine: "auto" | "manuel";
  publie_le: Date;
  // Rendez-vous (exposition, vernissage, talk show) : dates au format AAAA-MM-JJ.
  evenement_debut: string | null;
  evenement_fin: string | null;
  lieu: string | null;
  // Adresses de vidéos TikTok, Instagram ou YouTube, une par ligne.
  videos: string | null;
  // Page d'un artiste ArTova liée à l'article.
  artiste_slug: string | null;
  // Photos supplémentaires (une adresse par ligne) et crédit de l'image.
  images: string | null;
  credit_image: string | null;
  // Personnes citées (JSON : [{ nom, slug }]).
  personnes: string | null;
  // Traductions anglaise et allemande (JSON : { en: {titre, resume, contenu}, de: … }).
  traductions: string | null;
  nb_likes: number;
  nb_commentaires: number;
}

export interface CommentaireActualite {
  id: number;
  utilisateur_id: number;
  auteur: string;
  texte: string;
  cree_le: Date;
}

function formats(langue: Langue) {
  const loc = LOCALES[langue];
  return {
    loc,
    relatif: new Intl.RelativeTimeFormat(loc, { numeric: "auto" }),
    jourMois: new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", timeZone: "Africa/Lome" }),
    jourLong: new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lome" }),
    complete: new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lome" }),
  };
}

export function ilYa(date: Date | string, langue: Langue = "fr"): string {
  const f = formats(langue);
  const d = new Date(date);
  const minutes = Math.round((d.getTime() - Date.now()) / 60000);
  if (minutes > -60) return f.relatif.format(Math.min(0, minutes), "minute");
  const heures = Math.round(minutes / 60);
  if (heures > -24) return f.relatif.format(heures, "hour");
  const jours = Math.round(heures / 24);
  if (jours > -7) return f.relatif.format(jours, "day");
  return f.jourMois.format(d);
}

// « 24 novembre 2026 », pour la ligne de date sous les titres.
export function dateLongue(date: Date | string, langue: Langue = "fr"): string {
  return formats(langue).complete.format(new Date(date));
}

export function dateEditoriale(date: Date = new Date(), langue: Langue = "fr"): string {
  const texte = formats(langue).jourLong.format(date);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// ─── Rendez-vous : dates d'exposition ────────────────────────────────────────

function jourUtc(date: string): Date {
  const [a, m, j] = date.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

// Lomé est à l'heure UTC toute l'année : la date du jour s'y lit directement.
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function libelleDates(debut: string, fin: string | null, langue: Langue = "fr"): string {
  const loc = LOCALES[langue];
  const court = (d: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(loc, { ...options, timeZone: "UTC" }).format(d);
  const d = jourUtc(debut);
  if (!fin || fin === debut) return court(d, { weekday: "short", day: "numeric", month: "short" });
  const f = jourUtc(fin);
  if (d.getUTCMonth() === f.getUTCMonth()) {
    return `${d.getUTCDate()}–${court(f, { day: "numeric", month: "short" })}`;
  }
  return `${court(d, { day: "numeric", month: "short" })} – ${court(f, { day: "numeric", month: "short" })}`;
}

export type TonEvenement = "en_cours" | "bientot" | "termine";

export function etatEvenement(
  debut: string,
  fin: string | null,
  auj: string = aujourdhui(),
  langue: Langue = "fr",
): { texte: string; ton: TonEvenement } {
  const e = TEXTES[langue].etat;
  if (auj > (fin ?? debut)) return { texte: e.termine, ton: "termine" };
  if (auj >= debut) return { texte: e.enCours, ton: "en_cours" };
  const jours = Math.round((jourUtc(debut).getTime() - jourUtc(auj).getTime()) / 86_400_000);
  if (jours === 1) return { texte: e.demain, ton: "bientot" };
  if (jours <= 6) {
    const jour = new Intl.DateTimeFormat(LOCALES[langue], { weekday: "long", timeZone: "UTC" }).format(jourUtc(debut));
    return { texte: fmt(e.ce, { jour: langue === "en" ? jour.charAt(0).toUpperCase() + jour.slice(1) : jour }), ton: "bientot" };
  }
  return { texte: e.aVenir, ton: "bientot" };
}

// Typographie française : une espace insécable avant « : ; ! ? » et autour des
// guillemets, pour qu'un signe ne se retrouve jamais seul en début de ligne.
export function fr(texte: string): string {
  return texte
    .replace(/«[ \u202f]/g, "«\u00a0")
    .replace(/[ \u202f]+([»:;!?])/g, "\u00a0$1");
}

// ─── Traductions du contenu ──────────────────────────────────────────────────

export interface ContenuTraduit {
  titre?: string;
  resume?: string;
  contenu?: string;
}

export function lireTraductions(brut: string | null | undefined): Partial<Record<Langue, ContenuTraduit>> {
  if (!brut) return {};
  try {
    const v = JSON.parse(brut) as unknown;
    return v && typeof v === "object" ? (v as Partial<Record<Langue, ContenuTraduit>>) : {};
  } catch {
    return {};
  }
}

// Titre, résumé et texte d'une actualité dans la langue demandée ; à défaut de
// traduction, le texte d'origine.
export function contenuLangue(
  a: { titre: string; resume: string; contenu: string | null; traductions: string | null },
  langue: Langue,
): { titre: string; resume: string; contenu: string | null } {
  if (langue === "fr") return { titre: a.titre, resume: a.resume, contenu: a.contenu };
  const t = lireTraductions(a.traductions)[langue];
  return { titre: t?.titre || a.titre, resume: t?.resume || a.resume, contenu: t?.contenu || a.contenu };
}

// ─── Vidéos intégrées ────────────────────────────────────────────────────────

export type PlateformeVideo = "tiktok" | "instagram" | "youtube";

export interface VideoIntegree {
  plateforme: PlateformeVideo;
  // Adresse de la page d'origine, pour le lien « Voir sur … ».
  url: string;
  // Adresse du lecteur intégré.
  lecteur: string;
  // Les vidéos TikTok et Instagram sont verticales, YouTube est en 16/9.
  vertical: boolean;
  // Intégration d'un profil Instagram (ses dernières publications), pas d'une publication.
  profil?: boolean;
}

// Reconnaît une adresse de vidéo TikTok, Instagram ou YouTube. Les liens courts
// (vm.tiktok.com) ne sont pas acceptés : ils cachent l'identifiant de la vidéo.
export function lireVideo(brut: string): VideoIntegree | null {
  let u: URL;
  try {
    u = new URL(brut.trim());
  } catch {
    return null;
  }
  const hote = u.hostname.replace(/^www\.|^m\./, "");
  if (hote === "tiktok.com") {
    const m = /\/video\/(\d{8,25})/.exec(u.pathname);
    return m ? { plateforme: "tiktok", url: `https://www.tiktok.com${u.pathname}`, lecteur: `https://www.tiktok.com/embed/v2/${m[1]}`, vertical: true } : null;
  }
  if (hote === "instagram.com") {
    const m = /\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,20})/.exec(u.pathname);
    if (!m) {
      // Adresse d'un profil (instagram.com/nom) : intégration officielle du profil.
      const profil = /^\/([A-Za-z0-9._]{2,30})\/?$/.exec(u.pathname)?.[1];
      const reserves = ["explore", "accounts", "stories", "direct", "about", "reels", "p", "reel", "tv", "developer", "legal"];
      if (!profil || reserves.includes(profil.toLowerCase())) return null;
      return {
        plateforme: "instagram",
        url: `https://www.instagram.com/${profil}/`,
        lecteur: `https://www.instagram.com/${profil}/embed`,
        vertical: true,
        profil: true,
      };
    }
    const genre = m[1] === "reels" ? "reel" : m[1];
    return { plateforme: "instagram", url: `https://www.instagram.com/${genre}/${m[2]}/`, lecteur: `https://www.instagram.com/${genre}/${m[2]}/embed`, vertical: true };
  }
  let id: string | null = null;
  if (hote === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
  else if (hote === "youtube.com" || hote === "youtube-nocookie.com") {
    id = u.searchParams.get("v") ?? /\/(?:shorts|embed|live)\/([\w-]{6,20})/.exec(u.pathname)?.[1] ?? null;
  }
  if (id && /^[\w-]{6,20}$/.test(id)) {
    return { plateforme: "youtube", url: `https://www.youtube.com/watch?v=${id}`, lecteur: `https://www.youtube-nocookie.com/embed/${id}`, vertical: false };
  }
  return null;
}

export function lireVideos(texte: string | null | undefined): VideoIntegree[] {
  if (!texte) return [];
  const vues = new Set<string>();
  const videos: VideoIntegree[] = [];
  for (const ligne of texte.split(/[\r\n]+/)) {
    const v = lireVideo(ligne);
    if (v && !vues.has(v.lecteur)) {
      vues.add(v.lecteur);
      videos.push(v);
    }
  }
  return videos.slice(0, 6);
}

// ─── Personnes citées ────────────────────────────────────────────────────────

export interface PersonneCitee {
  nom: string;
  // Page de l'artiste sur ArTova, quand elle existe.
  slug: string | null;
}

export function lirePersonnes(brut: string | null | undefined): PersonneCitee[] {
  if (!brut) return [];
  try {
    const v = JSON.parse(brut) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is { nom: string; slug?: string | null } => Boolean(x) && typeof (x as { nom?: unknown }).nom === "string")
      .map((x) => ({ nom: x.nom.slice(0, 80), slug: typeof x.slug === "string" ? x.slug : null }))
      .slice(0, 20);
  } catch {
    return [];
  }
}
