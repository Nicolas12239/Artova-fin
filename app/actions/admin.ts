"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/upload";
import {
  schemaArtiste,
  schemaOeuvre,
  schemaStatutCommande,
  slugifier,
} from "@/lib/validation";

export type EtatAdmin = { erreur?: string; succes?: string } | null;

async function exigeraAdmin() {
  const utilisateur = await getCurrentUser();
  if (!utilisateur || utilisateur.role !== "admin") redirect("/");
  return utilisateur;
}

export async function changerStatutCommande(
  commandeId: number,
  formData: FormData,
): Promise<void> {
  await exigeraAdmin();
  const parse = schemaStatutCommande.safeParse(String(formData.get("statut")));
  if (!parse.success) return;
  const statut = parse.data;

  const commandes = await query<{ oeuvre_id: number }>(
    "SELECT oeuvre_id FROM commandes WHERE id = ? LIMIT 1",
    [commandeId],
  );
  if (commandes.length === 0) return;

  await execute("UPDATE commandes SET statut = ? WHERE id = ?", [
    statut,
    commandeId,
  ]);

  if (statut === "annulee") {
    await execute(
      "UPDATE oeuvres SET statut = 'disponible' WHERE id = ? AND statut = 'reserve'",
      [commandes[0].oeuvre_id],
    );
  } else if (statut === "livree") {
    await execute("UPDATE oeuvres SET statut = 'vendu' WHERE id = ?", [
      commandes[0].oeuvre_id,
    ]);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
  revalidatePath("/compte");
}

export async function enregistrerArtiste(
  _prev: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  await exigeraAdmin();

  const portrait = formData.get("portrait") as File | null;
  let portrait_url: string | null = null;
  if (portrait && portrait.size > 0) {
    portrait_url = await saveUpload(portrait, "artiste");
    if (!portrait_url) return { erreur: "Image de portrait invalide (JPEG, PNG ou WebP, 8 Mo max)." };
  }

  const parse = schemaArtiste.safeParse({
    id: formData.get("id") || undefined,
    nom: String(formData.get("nom") ?? ""),
    discipline: String(formData.get("discipline") ?? ""),
    ville: String(formData.get("ville") ?? ""),
    histoire: String(formData.get("histoire") ?? ""),
    note_univers: String(formData.get("note_univers") ?? ""),
    theme_primaire: String(formData.get("theme_primaire") ?? ""),
    theme_accent: String(formData.get("theme_accent") ?? ""),
    theme_fond: String(formData.get("theme_fond") ?? ""),
    motif: String(formData.get("motif") ?? ""),
  });
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const donnees = parse.data;

  if (donnees.id) {
    if (portrait_url) {
      await execute(
        `UPDATE artistes SET nom=?, discipline=?, ville=?, histoire=?, note_univers=?,
         theme_primaire=?, theme_accent=?, theme_fond=?, motif=?, portrait_url=? WHERE id=?`,
        [
          donnees.nom, donnees.discipline, donnees.ville || null, donnees.histoire,
          donnees.note_univers || null, donnees.theme_primaire, donnees.theme_accent,
          donnees.theme_fond, donnees.motif, portrait_url, donnees.id,
        ],
      );
    } else {
      await execute(
        `UPDATE artistes SET nom=?, discipline=?, ville=?, histoire=?, note_univers=?,
         theme_primaire=?, theme_accent=?, theme_fond=?, motif=? WHERE id=?`,
        [
          donnees.nom, donnees.discipline, donnees.ville || null, donnees.histoire,
          donnees.note_univers || null, donnees.theme_primaire, donnees.theme_accent,
          donnees.theme_fond, donnees.motif, donnees.id,
        ],
      );
    }
  } else {
    if (!portrait_url) {
      return { erreur: "Un portrait est requis pour créer un artiste." };
    }
    let slug = slugifier(donnees.nom) || "artiste";
    for (let i = 2; ; i++) {
      const existants = await query<{ id: number }>(
        "SELECT id FROM artistes WHERE slug = ? LIMIT 1",
        [slug],
      );
      if (existants.length === 0) break;
      slug = `${slugifier(donnees.nom)}-${i}`;
    }
    await execute(
      `INSERT INTO artistes (slug, nom, discipline, ville, histoire, note_univers,
       theme_primaire, theme_accent, theme_fond, motif, portrait_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, donnees.nom, donnees.discipline, donnees.ville || null,
        donnees.histoire, donnees.note_univers || null, donnees.theme_primaire,
        donnees.theme_accent, donnees.theme_fond, donnees.motif, portrait_url,
      ],
    );
  }

  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
  return { succes: "Artiste enregistré." };
}

export async function enregistrerOeuvre(
  _prev: EtatAdmin,
  formData: FormData,
): Promise<EtatAdmin> {
  await exigeraAdmin();

  const image = formData.get("image") as File | null;
  let image_url: string | null = null;
  if (image && image.size > 0) {
    image_url = await saveUpload(image, "oeuvre");
    if (!image_url) return { erreur: "Image invalide (JPEG, PNG ou WebP, 8 Mo max)." };
  }

  const parse = schemaOeuvre.safeParse({
    id: formData.get("id") || undefined,
    artiste_id: formData.get("artiste_id") ?? "",
    titre: String(formData.get("titre") ?? ""),
    type: String(formData.get("type") ?? ""),
    prix_fcfa: formData.get("prix_fcfa") ?? "",
    annee: formData.get("annee") ?? "",
    dimensions: String(formData.get("dimensions") ?? ""),
    technique: String(formData.get("technique") ?? ""),
    description: String(formData.get("description") ?? ""),
    oeuvre_maitre: formData.get("oeuvre_maitre") === "1",
    statut: String(formData.get("statut") ?? "disponible"),
  });
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const donnees = parse.data;

  if (donnees.id) {
    if (image_url) {
      await execute(
        `UPDATE oeuvres SET artiste_id=?, titre=?, type=?, prix_fcfa=?, annee=?, dimensions=?,
         technique=?, description=?, oeuvre_maitre=?, statut=?, image_url=? WHERE id=?`,
        [
          donnees.artiste_id, donnees.titre, donnees.type, donnees.prix_fcfa,
          donnees.annee || null, donnees.dimensions || null, donnees.technique || null,
          donnees.description, donnees.oeuvre_maitre ? 1 : 0, donnees.statut,
          image_url, donnees.id,
        ],
      );
    } else {
      await execute(
        `UPDATE oeuvres SET artiste_id=?, titre=?, type=?, prix_fcfa=?, annee=?, dimensions=?,
         technique=?, description=?, oeuvre_maitre=?, statut=? WHERE id=?`,
        [
          donnees.artiste_id, donnees.titre, donnees.type, donnees.prix_fcfa,
          donnees.annee || null, donnees.dimensions || null, donnees.technique || null,
          donnees.description, donnees.oeuvre_maitre ? 1 : 0, donnees.statut,
          donnees.id,
        ],
      );
    }
  } else {
    if (!image_url) {
      return { erreur: "Une image est requise pour créer une œuvre." };
    }
    await execute(
      `INSERT INTO oeuvres (artiste_id, titre, type, prix_fcfa, annee, dimensions, technique,
       description, image_url, oeuvre_maitre, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donnees.artiste_id, donnees.titre, donnees.type, donnees.prix_fcfa,
        donnees.annee || null, donnees.dimensions || null, donnees.technique || null,
        donnees.description, image_url, donnees.oeuvre_maitre ? 1 : 0, donnees.statut,
      ],
    );
  }

  if (donnees.oeuvre_maitre) {
    await execute(
      "UPDATE oeuvres SET oeuvre_maitre = 0 WHERE artiste_id = ? AND id <> ?",
      [donnees.artiste_id, donnees.id ?? 0],
    );
  }

  revalidatePath("/admin/oeuvres");
  revalidatePath("/artistes");
  return { succes: "Œuvre enregistrée." };
}
