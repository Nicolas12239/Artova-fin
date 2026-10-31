import { randomUUID } from "crypto";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { execute } from "./db";

// Garde-fou mémoire uniquement : toute photo raisonnable passe, quelle que soit
// sa taille d'origine, puis est redimensionnée automatiquement.
const TAILLE_MAX = 100 * 1024 * 1024;

// Plus grand côté conservé selon l'usage de l'image.
const COTE_MAX: Record<string, number> = {
  banniere: 2400,
  artiste: 1600,
  oeuvre: 2000,
};

const EXTENSIONS_IMAGES = /\.(jpe?g|png|webp|heic|heif|avif|gif|tiff?|bmp)$/i;

function estImage(fichier: File): boolean {
  // Certains navigateurs n'indiquent pas de type pour les photos HEIC d'iPhone.
  return fichier.type.startsWith("image/") || EXTENSIONS_IMAGES.test(fichier.name);
}

// Signature des fichiers HEIC/HEIF (« ftyp heic », « mif1 »…), que la version
// précompilée de sharp ne sait pas décoder.
function estHeic(donnees: Buffer): boolean {
  if (donnees.length < 12 || donnees.toString("ascii", 4, 8) !== "ftyp") return false;
  return ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(
    donnees.toString("ascii", 8, 12),
  );
}

async function versWebp(source: Buffer, cote: number): Promise<Buffer> {
  return sharp(source, { failOn: "none", limitInputPixels: 400_000_000 })
    .rotate() // orientation EXIF des photos de téléphone
    .resize({ width: cote, height: cote, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

export const MESSAGE_IMAGE_INVALIDE =
  "Ce fichier n'a pas pu être lu comme une image. Choisissez une photo (JPEG, PNG, HEIC, WebP…).";

// Les images sont converties en WebP et stockées en base : le service web
// n'a pas de disque persistant en production, la base si.
export async function saveUpload(
  fichier: File,
  prefixe: string,
): Promise<string | null> {
  if (!estImage(fichier) || fichier.size === 0 || fichier.size > TAILLE_MAX) return null;

  const brut = Buffer.from(await fichier.arrayBuffer());
  const cote = COTE_MAX[prefixe] ?? 2000;
  let donnees: Buffer;
  try {
    donnees = await versWebp(brut, cote);
  } catch (erreur) {
    if (!estHeic(brut)) {
      console.error("[ArTova] Image illisible :", fichier.name, fichier.type, erreur);
      return null;
    }
    try {
      const jpeg = await heicConvert({ buffer: brut, format: "JPEG", quality: 0.92 });
      donnees = await versWebp(Buffer.from(jpeg), cote);
    } catch (erreurHeic) {
      console.error("[ArTova] Photo HEIC illisible :", fichier.name, erreurHeic);
      return null;
    }
  }

  const id = randomUUID().replaceAll("-", "");
  await execute("INSERT INTO fichiers (id, type, donnees) VALUES (?, 'image/webp', ?)", [
    id,
    donnees,
  ]);
  return `/fichiers/${id}`;
}
