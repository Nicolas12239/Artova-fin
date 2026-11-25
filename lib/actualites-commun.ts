// Types, libellés et formats partagés par le serveur et les composants du
// navigateur : ce fichier ne doit jamais importer la base de données.
import type { Portee } from "./actualites-sources";

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

const relatif = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const jourMois = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Lome" });
const jourLong = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lome",
});

export function ilYa(date: Date | string): string {
  const d = new Date(date);
  const minutes = Math.round((d.getTime() - Date.now()) / 60000);
  if (minutes > -60) return relatif.format(Math.min(0, minutes), "minute");
  const heures = Math.round(minutes / 60);
  if (heures > -24) return relatif.format(heures, "hour");
  const jours = Math.round(heures / 24);
  if (jours > -7) return relatif.format(jours, "day");
  return jourMois.format(d);
}

const dateComplete = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lome" });

// « 24 novembre 2026 », pour la ligne de date sous les titres.
export function dateLongue(date: Date | string): string {
  return dateComplete.format(new Date(date));
}

export function dateEditoriale(date: Date = new Date()): string {
  const texte = jourLong.format(date);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// ─── Rendez-vous : dates d'exposition ────────────────────────────────────────

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const JOURS_LONGS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function jourUtc(date: string): Date {
  const [a, m, j] = date.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

// Lomé est à l'heure UTC toute l'année : la date du jour s'y lit directement.
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function libelleDates(debut: string, fin: string | null): string {
  const d = jourUtc(debut);
  if (!fin || fin === debut) return `${JOURS_COURTS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]}`;
  const f = jourUtc(fin);
  if (d.getUTCMonth() === f.getUTCMonth()) return `${d.getUTCDate()}–${f.getUTCDate()} ${MOIS_COURTS[f.getUTCMonth()]}`;
  return `${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]} – ${f.getUTCDate()} ${MOIS_COURTS[f.getUTCMonth()]}`;
}

export type TonEvenement = "en_cours" | "bientot" | "termine";

export function etatEvenement(debut: string, fin: string | null, auj: string = aujourdhui()): { texte: string; ton: TonEvenement } {
  if (auj > (fin ?? debut)) return { texte: "Terminée", ton: "termine" };
  if (auj >= debut) return { texte: "En cours", ton: "en_cours" };
  const jours = Math.round((jourUtc(debut).getTime() - jourUtc(auj).getTime()) / 86_400_000);
  if (jours === 1) return { texte: "Demain", ton: "bientot" };
  if (jours <= 6) return { texte: `Ce ${JOURS_LONGS[jourUtc(debut).getUTCDay()]}`, ton: "bientot" };
  return { texte: "À venir", ton: "bientot" };
}

// Typographie française : une espace insécable avant « : ; ! ? » et autour des
// guillemets, pour qu'un signe ne se retrouve jamais seul en début de ligne.
export function fr(texte: string): string {
  return texte
    .replace(/«[ \u202f]/g, "«\u00a0")
    .replace(/[ \u202f]+([»:;!?])/g, "\u00a0$1");
}
