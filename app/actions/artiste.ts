"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getArtistePourUtilisateur, slugUnique } from "@/lib/artistes";
import { MESSAGE_IMAGE_INVALIDE, saveUpload } from "@/lib/upload";
import { schemaOeuvre, schemaPageArtiste } from "@/lib/validation";
import { sendNouvelArtistePush } from "@/lib/ntfy";
import { LIBELLE_DISCIPLINE, type Artiste } from "@/lib/types";

export type EtatArtiste = { erreur?: string; succes?: string } | null;

async function exigerArtiste(): Promise<Artiste> {
  const utilisateur = await getCurrentUser();
  if (!utilisateur || utilisateur.role !== "artiste") redirect("/");
  const artiste = await getArtistePourUtilisateur(utilisateur.id);
  if (!artiste) redirect("/");
  return artiste;
}

function revalider(artiste: Pick<Artiste, "slug">) {
  revalidatePath("/espace-artiste");
  revalidatePath("/artistes");
  revalidatePath(`/artistes/${artiste.slug}`);
  revalidatePath("/");
}

async function televerser(
  formData: FormData,
  champ: string,
  prefixe: string,
): Promise<string | null | "invalide"> {
  const fichier = formData.get(champ) as File | null;
  if (!fichier || fichier.size === 0) return null;
  return (await saveUpload(fichier, prefixe)) ?? "invalide";
}

export async function enregistrerMaPage(
  _prev: EtatArtiste,
  formData: FormData,
): Promise<EtatArtiste> {
  const artiste = await exigerArtiste();

  const parse = schemaPageArtiste.safeParse({
    nom: String(formData.get("nom") ?? ""),
    discipline: String(formData.get("discipline") ?? ""),
    ville: String(formData.get("ville") ?? ""),
    histoire: String(formData.get("histoire") ?? ""),
    note_univers: String(formData.get("note_univers") ?? ""),
    theme_primaire: String(formData.get("theme_primaire") ?? ""),
    theme_accent: String(formData.get("theme_accent") ?? ""),
    theme_fond: String(formData.get("theme_fond") ?? ""),
    motif: String(formData.get("motif") ?? ""),
    annee_debut: formData.get("annee_debut") ?? "",
    formation: String(formData.get("formation") ?? ""),
    techniques: String(formData.get("techniques") ?? ""),
    expositions: String(formData.get("expositions") ?? ""),
  });
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parse.data;

  const portrait = await televerser(formData, "portrait", "artiste");
  if (portrait === "invalide") {
    return { erreur: `Portrait : ${MESSAGE_IMAGE_INVALIDE}` };
  }
  const banniere = await televerser(formData, "banniere", "banniere");
  if (banniere === "invalide") {
    return { erreur: `Bannière : ${MESSAGE_IMAGE_INVALIDE}` };
  }
  if (!portrait && !artiste.portrait_url) {
    return { erreur: "Ajoutez un portrait : il présente votre page aux collectionneurs." };
  }

  // L'adresse de la page reste stable une fois publiée.
  const slug = artiste.statut === "publie" ? artiste.slug : await slugUnique(d.nom, artiste.id);
  const banniereFinale =
    banniere ?? (formData.get("retirer_banniere") === "1" ? null : artiste.banniere_url);

  await execute(
    `UPDATE artistes SET slug=?, nom=?, discipline=?, ville=?, histoire=?, note_univers=?,
     theme_primaire=?, theme_accent=?, theme_fond=?, motif=?, portrait_url=?, banniere_url=?,
     annee_debut=?, formation=?, techniques=?, expositions=? WHERE id=?`,
    [
      slug, d.nom, d.discipline, d.ville || null, d.histoire, d.note_univers || null,
      d.theme_primaire, d.theme_accent, d.theme_fond, d.motif,
      portrait ?? artiste.portrait_url, banniereFinale,
      d.annee_debut || null, d.formation || null, d.techniques || null,
      d.expositions || null, artiste.id,
    ],
  );

  revalider({ slug });
  if (artiste.slug !== slug) revalidatePath(`/artistes/${artiste.slug}`);
  return { succes: "Votre page a été enregistrée." };
}

export async function soumettreMaPage(): Promise<void> {
  const artiste = await exigerArtiste();
  if (artiste.statut !== "brouillon") return;
  const [nb] = await query<{ nb: number }>(
    "SELECT COUNT(*) AS nb FROM oeuvres WHERE artiste_id = ?",
    [artiste.id],
  );
  const complete =
    artiste.portrait_url && artiste.histoire.length >= 80 && Number(nb?.nb ?? 0) > 0;
  if (!complete) redirect("/espace-artiste?incomplet=1");

  await execute("UPDATE artistes SET statut = 'en_attente' WHERE id = ?", [artiste.id]);
  try {
    await sendNouvelArtistePush({
      nom: artiste.nom,
      discipline: LIBELLE_DISCIPLINE[artiste.discipline],
      ville: artiste.ville,
      motif: "soumission",
    });
  } catch (erreur) {
    console.error("[ArTova] Échec de la notification de soumission :", erreur);
  }
  revalidatePath("/espace-artiste");
  revalidatePath("/admin");
  revalidatePath("/admin/artistes");
}

export async function enregistrerMonOeuvre(
  _prev: EtatArtiste,
  formData: FormData,
): Promise<EtatArtiste> {
  const artiste = await exigerArtiste();

  const parse = schemaOeuvre.safeParse({
    id: formData.get("id") || undefined,
    artiste_id: artiste.id,
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
  const d = parse.data;

  if (d.id) {
    const miennes = await query<{ id: number }>(
      "SELECT id FROM oeuvres WHERE id = ? AND artiste_id = ? LIMIT 1",
      [d.id, artiste.id],
    );
    if (miennes.length === 0) return { erreur: "Œuvre introuvable." };
  }

  const image = await televerser(formData, "image", "oeuvre");
  if (image === "invalide") return { erreur: `Photo de l'œuvre : ${MESSAGE_IMAGE_INVALIDE}` };

  let oeuvreId = d.id ?? 0;
  if (d.id) {
    await execute(
      `UPDATE oeuvres SET titre=?, type=?, prix_fcfa=?, annee=?, dimensions=?, technique=?,
       description=?, oeuvre_maitre=?, statut=?, image_url=COALESCE(?, image_url)
       WHERE id=? AND artiste_id=?`,
      [
        d.titre, d.type, d.prix_fcfa, d.annee || null, d.dimensions || null,
        d.technique || null, d.description, d.oeuvre_maitre ? 1 : 0, d.statut,
        image, d.id, artiste.id,
      ],
    );
  } else {
    if (!image) return { erreur: "Ajoutez une photo de l'œuvre." };
    const resultat = await execute(
      `INSERT INTO oeuvres (artiste_id, titre, type, prix_fcfa, annee, dimensions, technique,
       description, image_url, oeuvre_maitre, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artiste.id, d.titre, d.type, d.prix_fcfa, d.annee || null, d.dimensions || null,
        d.technique || null, d.description, image, d.oeuvre_maitre ? 1 : 0, d.statut,
      ],
    );
    oeuvreId = Number(resultat.insertId);
  }

  if (d.oeuvre_maitre) {
    await execute(
      "UPDATE oeuvres SET oeuvre_maitre = 0 WHERE artiste_id = ? AND id <> ?",
      [artiste.id, oeuvreId],
    );
  }

  revalider(artiste);
  revalidatePath(`/oeuvres/${oeuvreId}`);
  if (!d.id) redirect("/espace-artiste?onglet=oeuvres&ajout=1");
  return { succes: "Œuvre mise à jour." };
}

export async function supprimerMonOeuvre(oeuvreId: number): Promise<void> {
  const artiste = await exigerArtiste();
  const [commandes] = await query<{ nb: number }>(
    "SELECT COUNT(*) AS nb FROM commandes WHERE oeuvre_id = ?",
    [oeuvreId],
  );
  // Une œuvre déjà commandée reste en base pour conserver l'historique.
  if (Number(commandes?.nb ?? 0) > 0) {
    redirect("/espace-artiste?onglet=oeuvres&suppression=impossible");
  }
  await execute("DELETE FROM oeuvres WHERE id = ? AND artiste_id = ?", [oeuvreId, artiste.id]);
  revalider(artiste);
  redirect("/espace-artiste?onglet=oeuvres");
}
