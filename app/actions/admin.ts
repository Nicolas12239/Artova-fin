"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MESSAGE_IMAGE_INVALIDE, saveUpload } from "@/lib/upload";
import { destinatairesArtova, envoyerEmail } from "@/lib/email";
import { envoyerWhatsapp } from "@/lib/whatsapp";
import { envoyerPush, getSiteUrl } from "@/lib/ntfy";
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
    if (!portrait_url) return { erreur: `Portrait : ${MESSAGE_IMAGE_INVALIDE}` };
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
    if (!image_url) return { erreur: `Photo de l'œuvre : ${MESSAGE_IMAGE_INVALIDE}` };
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

export async function changerStatutArtiste(
  artisteId: number,
  statut: "publie" | "brouillon",
): Promise<void> {
  await exigeraAdmin();
  await execute("UPDATE artistes SET statut = ? WHERE id = ?", [statut, artisteId]);
  const artistes = await query<{ slug: string }>(
    "SELECT slug FROM artistes WHERE id = ? LIMIT 1",
    [artisteId],
  );
  revalidatePath("/admin");
  revalidatePath("/admin/artistes");
  revalidatePath("/artistes");
  revalidatePath("/");
  if (artistes[0]) revalidatePath(`/artistes/${artistes[0].slug}`);
}

export async function envoyerEmailTest(): Promise<void> {
  const admin = await exigeraAdmin();
  let resultat: string;
  try {
    const envoye = await envoyerEmail({
      to: destinatairesArtova(),
      subject: "[ArTova] Email de test",
      text: `Test envoyé depuis l'administration ArTova par ${admin.nom}. Si vous lisez ceci, les emails de commande arriveront bien ici.`,
      html: `<div style="font-family:Georgia,serif;padding:24px"><h1 style="font-size:24px">ArTova</h1><p>Test envoyé depuis l'administration par ${admin.nom.replace(/[<>&"]/g, "")}.</p><p>Si vous lisez ceci, les emails de commande arriveront bien ici.</p></div>`,
    });
    resultat = envoye ? "ok" : "non-configure";
  } catch (erreur) {
    console.error("[ArTova] Échec de l'email de test :", erreur);
    resultat = "erreur";
  }
  redirect(`/admin?email=${resultat}`);
}

async function resultatEnvoi(envoi: Promise<boolean>, canal: string): Promise<string> {
  try {
    return (await envoi) ? "ok" : "non-configure";
  } catch (erreur) {
    console.error(`[ArTova] Échec de la notification ${canal} de test :`, erreur);
    return "erreur";
  }
}

export async function envoyerAlertesTest(): Promise<void> {
  await exigeraAdmin();
  const site = getSiteUrl();
  const [push, whatsapp] = await Promise.all([
    resultatEnvoi(
      envoyerPush({
        titre: "ArTova : notification de test",
        message: "Vous recevrez une alerte comme celle-ci à chaque nouvelle commande.",
        lien: site ? `${site}/admin` : undefined,
        etiquettes: ["white_check_mark"],
      }),
      "push",
    ),
    resultatEnvoi(
      envoyerWhatsapp(
        "*ArTova* : message de test.\nVous recevrez une notification comme celle-ci à chaque nouvelle commande.",
      ),
      "WhatsApp",
    ),
  ]);
  redirect(`/admin?push=${push}&whatsapp=${whatsapp}`);
}

// Supprime une page d'artiste non conforme : page, œuvres, images et compte de
// connexion. Refusé si des commandes portent sur ses œuvres (historique des
// ventes) : il faut alors la dépublier.
export async function supprimerArtiste(artisteId: number): Promise<void> {
  await exigeraAdmin();
  const [artiste] = await query<{
    nom: string;
    slug: string;
    utilisateur_id: number | null;
    portrait_url: string | null;
    banniere_url: string | null;
  }>(
    "SELECT nom, slug, utilisateur_id, portrait_url, banniere_url FROM artistes WHERE id = ? LIMIT 1",
    [artisteId],
  );
  if (!artiste) redirect("/admin/artistes");

  const [ventes] = await query<{ nb: number }>(
    `SELECT COUNT(*) AS nb FROM commandes c JOIN oeuvres o ON o.id = c.oeuvre_id
     WHERE o.artiste_id = ?`,
    [artisteId],
  );
  if (Number(ventes?.nb ?? 0) > 0) {
    redirect(`/admin/artistes?suppression=commandes&nom=${encodeURIComponent(artiste.nom)}`);
  }

  const oeuvres = await query<{ image_url: string }>(
    "SELECT image_url FROM oeuvres WHERE artiste_id = ?",
    [artisteId],
  );
  const fichiers = [artiste.portrait_url, artiste.banniere_url, ...oeuvres.map((o) => o.image_url)]
    .filter((url): url is string => Boolean(url?.startsWith("/fichiers/")))
    .map((url) => url.slice("/fichiers/".length));

  await execute("DELETE FROM oeuvres WHERE artiste_id = ?", [artisteId]);
  await execute("DELETE FROM artistes WHERE id = ?", [artisteId]);
  if (fichiers.length > 0) {
    await execute(
      `DELETE FROM fichiers WHERE id IN (${fichiers.map(() => "?").join(",")})`,
      fichiers,
    );
  }

  let compte = "aucun";
  if (artiste.utilisateur_id) {
    const [achats] = await query<{ nb: number }>(
      "SELECT COUNT(*) AS nb FROM commandes WHERE utilisateur_id = ?",
      [artiste.utilisateur_id],
    );
    if (Number(achats?.nb ?? 0) > 0) {
      // Ses propres achats restent dans l'historique : le compte redevient collectionneur.
      await execute(
        "UPDATE utilisateurs SET role = 'client' WHERE id = ? AND role = 'artiste'",
        [artiste.utilisateur_id],
      );
      compte = "conserve";
    } else {
      await execute("DELETE FROM utilisateurs WHERE id = ? AND role = 'artiste'", [
        artiste.utilisateur_id,
      ]);
      compte = "supprime";
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/artistes");
  revalidatePath("/admin/inscrits");
  revalidatePath("/artistes");
  revalidatePath(`/artistes/${artiste.slug}`);
  revalidatePath("/");
  redirect(
    `/admin/artistes?suppression=ok&compte=${compte}&nom=${encodeURIComponent(artiste.nom)}`,
  );
}
