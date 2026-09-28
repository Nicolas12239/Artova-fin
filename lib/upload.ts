import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const EXTENSIONS_PAR_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const TAILLE_MAX = 8 * 1024 * 1024;

export async function saveUpload(
  fichier: File,
  prefixe: string,
): Promise<string | null> {
  const extension = EXTENSIONS_PAR_TYPE[fichier.type];
  if (!extension || fichier.size === 0 || fichier.size > TAILLE_MAX) return null;
  const nom = `${prefixe}-${randomUUID()}${extension}`;
  const dossier = path.join(process.cwd(), "public", "uploads");
  await mkdir(dossier, { recursive: true });
  const buffer = Buffer.from(await fichier.arrayBuffer());
  await writeFile(path.join(dossier, nom), buffer);
  return `/uploads/${nom}`;
}
