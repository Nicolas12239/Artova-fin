// Documents que les artistes peuvent téléverser pour leur histoire et leur
// parcours. Partagé avec le navigateur : aucune dépendance serveur.

export const RUBRIQUES_DOCUMENT = ["histoire", "parcours"] as const;
export type RubriqueDocument = (typeof RUBRIQUES_DOCUMENT)[number];

// Poids maximal d'un fichier joint (le texte d'un fichier plus lourd est tout de
// même repris). L'ensemble d'un envoi doit rester sous la limite de l'hébergeur.
export const TAILLE_MAX_DOCUMENT = 2 * 1024 * 1024;
export const TAILLE_MAX_ENVOI = 4_300_000;
export const LONGUEUR_MAX: Record<RubriqueDocument, number> = { histoire: 10_000, parcours: 6_000 };

export const TYPES_DOCUMENT = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
  txt: "text/plain; charset=utf-8",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
} as const;
export type GenreDocument = keyof typeof TYPES_DOCUMENT;

export const ACCEPT_DOCUMENTS = ".pdf,.docx,.doc,.odt,.rtf,.txt,image/*,.heic,.heif";

export function genreDocument(nom: string): GenreDocument | null {
  const extension = /\.([a-z0-9]+)$/i.exec(nom)?.[1]?.toLowerCase() ?? "";
  if (extension === "jpeg") return "jpg";
  if (extension === "heif") return "heic";
  return Object.hasOwn(TYPES_DOCUMENT, extension) ? (extension as GenreDocument) : null;
}

export interface DocumentArtiste {
  id: string;
  rubrique: RubriqueDocument;
  nom: string;
  public: number;
  // Texte qui avait été repris de ce fichier (retiré avec lui sur demande).
  texte?: string | null;
}
