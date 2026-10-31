import { query } from "./db";
import { slugifier } from "./validation";
import type { Artiste } from "./types";

export async function slugUnique(nom: string, saufId = 0): Promise<string> {
  const base = slugifier(nom) || "artiste";
  let slug = base;
  for (let i = 2; ; i++) {
    const existants = await query<{ id: number }>(
      "SELECT id FROM artistes WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, saufId],
    );
    if (existants.length === 0) return slug;
    slug = `${base}-${i}`;
  }
}

export async function getArtistePourUtilisateur(
  utilisateurId: number,
): Promise<Artiste | null> {
  const rows = await query<Artiste>(
    "SELECT * FROM artistes WHERE utilisateur_id = ? LIMIT 1",
    [utilisateurId],
  );
  return rows[0] ?? null;
}

// Une page non publiée n'est visible que par son artiste et l'administration.
export function peutVoirArtiste(
  artiste: Pick<Artiste, "statut" | "utilisateur_id">,
  utilisateur: { id: number; role: string } | null,
): boolean {
  if (artiste.statut === "publie") return true;
  if (!utilisateur) return false;
  return utilisateur.role === "admin" || artiste.utilisateur_id === utilisateur.id;
}
