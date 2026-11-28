import { randomUUID } from "node:crypto";
import { execute, query } from "./db";
import {
  genreDocument,
  LONGUEUR_MAX,
  RUBRIQUES_DOCUMENT,
  TAILLE_MAX_DOCUMENT,
  TYPES_DOCUMENT,
  type DocumentArtiste,
  type GenreDocument,
  type RubriqueDocument,
} from "./documents";

export interface DocumentPret {
  rubrique: RubriqueDocument;
  nom: string;
  type: string;
  donnees: Buffer;
  public: boolean;
  texte: string | null;
}

const LIBELLE: Record<RubriqueDocument, string> = { histoire: "Fichier de votre histoire", parcours: "Fichier de votre parcours" };

// Le contenu doit correspondre à l'extension : on ne se fie pas au nom seul.
function conforme(genre: GenreDocument, d: Buffer): boolean {
  const debut = (...octets: number[]) => octets.every((o, i) => d[i] === o);
  switch (genre) {
    case "pdf":
      return d.toString("latin1", 0, 1024).includes("%PDF-");
    case "docx":
    case "odt":
      return debut(0x50, 0x4b);
    case "doc":
      return debut(0xd0, 0xcf, 0x11, 0xe0);
    case "rtf":
      return d.toString("ascii", 0, 5) === "{\\rtf";
    case "txt":
      return !d.subarray(0, 4000).includes(0);
    case "jpg":
      return debut(0xff, 0xd8, 0xff);
    case "png":
      return debut(0x89, 0x50, 0x4e, 0x47);
    case "webp":
      return d.toString("ascii", 0, 4) === "RIFF" && d.toString("ascii", 8, 12) === "WEBP";
    case "heic":
      return d.toString("ascii", 4, 8) === "ftyp";
  }
}

// Lit et contrôle les fichiers joints au formulaire (avant toute écriture en base).
export async function lireDocumentsJoints(formData: FormData): Promise<{ documents: DocumentPret[]; erreur?: string }> {
  const documents: DocumentPret[] = [];
  for (const rubrique of RUBRIQUES_DOCUMENT) {
    const fichier = formData.get(`doc_${rubrique}`);
    if (!(fichier instanceof File) || fichier.size === 0) continue;
    if (fichier.size > TAILLE_MAX_DOCUMENT) {
      return { documents, erreur: `${LIBELLE[rubrique]} : il dépasse 2 Mo. Choisissez une version plus légère.` };
    }
    const genre = genreDocument(fichier.name);
    const donnees = Buffer.from(await fichier.arrayBuffer());
    if (!genre || !conforme(genre, donnees)) {
      return { documents, erreur: `${LIBELLE[rubrique]} : format non reconnu (PDF, Word, ODT, texte, RTF ou photo).` };
    }
    documents.push({
      rubrique,
      nom: fichier.name.replace(/[\u0000-\u001f"\\/]/g, " ").trim().slice(-150) || `document.${genre}`,
      type: TYPES_DOCUMENT[genre],
      donnees,
      public: formData.get(`doc_${rubrique}_public`) === "1",
      texte: String(formData.get(`doc_${rubrique}_texte`) ?? "").slice(0, LONGUEUR_MAX[rubrique]) || null,
    });
  }
  return { documents };
}

export async function documentsArtiste(artisteId: number): Promise<DocumentArtiste[]> {
  return query<DocumentArtiste>(
    "SELECT id, rubrique, nom, public, texte FROM documents_artistes WHERE artiste_id = ? ORDER BY rubrique",
    [artisteId],
  );
}

// Applique le formulaire : retraits demandés, nouveaux fichiers (un seul par
// rubrique) et choix « public » des fichiers conservés.
export async function enregistrerDocuments(artisteId: number, formData: FormData, nouveaux: DocumentPret[]): Promise<void> {
  for (const rubrique of RUBRIQUES_DOCUMENT) {
    const nouveau = nouveaux.find((d) => d.rubrique === rubrique);
    if (nouveau || formData.get(`retirer_doc_${rubrique}`) === "1") {
      await execute("DELETE FROM documents_artistes WHERE artiste_id = ? AND rubrique = ?", [artisteId, rubrique]);
    }
    if (nouveau) {
      await execute(
        "INSERT INTO documents_artistes (id, artiste_id, rubrique, nom, type, taille, public, donnees, texte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [randomUUID().replaceAll("-", ""), artisteId, rubrique, nouveau.nom, nouveau.type, nouveau.donnees.length, nouveau.public ? 1 : 0, nouveau.donnees, nouveau.texte],
      );
    } else {
      await execute("UPDATE documents_artistes SET public = ? WHERE artiste_id = ? AND rubrique = ?", [
        formData.get(`doc_${rubrique}_public`) === "1" ? 1 : 0,
        artisteId,
        rubrique,
      ]);
    }
  }
}
