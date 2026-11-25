"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { execute, poserTags, query, slugTag } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { estSousLimite } from "@/lib/rate-limit";
import { MESSAGE_IMAGE_INVALIDE, saveUpload } from "@/lib/upload";
import { adresseSure, nettoyerHtml } from "@/lib/actualites-flux";
import { collecterActualites } from "@/lib/actualites-collecte";
import { estCategorie, estPortee, lireVideo } from "@/lib/actualites";
import { estLangue, type Langue } from "@/lib/actualites-i18n";

export type EtatActualite = { erreur?: string; succes?: string } | null;

function rafraichir(): void {
  revalidatePath("/actualites");
  revalidatePath("/actualites/[id]", "page");
  revalidatePath("/admin/actualites");
  revalidatePath("/");
}

async function exigerAdmin() {
  const utilisateur = await getCurrentUser();
  if (!utilisateur || utilisateur.role !== "admin") redirect("/");
  return utilisateur;
}

// ─── Lecteurs : j'aime et commentaires (compte requis) ───────────────────────

async function actualitePubliee(id: number): Promise<boolean> {
  const rows = await query<{ id: number }>(
    "SELECT id FROM actualites WHERE id = ? AND statut = 'publie' LIMIT 1",
    [id],
  );
  return rows.length > 0;
}

const MESSAGES = {
  fr: {
    disparue: "Cette actualité n'existe plus.",
    doucement: "Doucement : réessayez dans quelques minutes.",
    connexion: "Connectez-vous pour commenter.",
    court: "Écrivez au moins quelques mots.",
    long: "Votre commentaire dépasse 1 000 caractères.",
    invalide: "Commentaire invalide.",
    vite: "Vous commentez très vite : patientez quelques minutes.",
    merci: "Merci, votre commentaire est publié.",
  },
  en: {
    disparue: "This story no longer exists.",
    doucement: "Easy: please try again in a few minutes.",
    connexion: "Sign in to comment.",
    court: "Please write at least a few words.",
    long: "Your comment is longer than 1,000 characters.",
    invalide: "Invalid comment.",
    vite: "You are commenting very fast: please wait a few minutes.",
    merci: "Thank you, your comment is published.",
  },
  de: {
    disparue: "Dieser Beitrag existiert nicht mehr.",
    doucement: "Langsam: Bitte versuchen Sie es in einigen Minuten erneut.",
    connexion: "Melden Sie sich an, um zu kommentieren.",
    court: "Bitte schreiben Sie mindestens ein paar Worte.",
    long: "Ihr Kommentar ist länger als 1.000 Zeichen.",
    invalide: "Ungültiger Kommentar.",
    vite: "Sie kommentieren sehr schnell: Bitte warten Sie einige Minuten.",
    merci: "Danke, Ihr Kommentar ist veröffentlicht.",
  },
} as const;

export async function basculerLike(
  actualiteId: number,
  langue: Langue = "fr",
): Promise<{ erreur?: string; aime?: boolean; total?: number }> {
  const m = MESSAGES[estLangue(langue) ? langue : "fr"];
  const utilisateur = await getCurrentUser();
  if (!utilisateur) return { erreur: "connexion" };
  if (!Number.isInteger(actualiteId) || !(await actualitePubliee(actualiteId))) {
    return { erreur: m.disparue };
  }
  if (!estSousLimite(`like:${utilisateur.id}`, 40, 10 * 60 * 1000)) {
    return { erreur: m.doucement };
  }

  const existant = await query<{ n: number }>(
    "SELECT 1 AS n FROM actualites_likes WHERE actualite_id = ? AND utilisateur_id = ? LIMIT 1",
    [actualiteId, utilisateur.id],
  );
  let aime: boolean;
  if (existant.length > 0) {
    await execute("DELETE FROM actualites_likes WHERE actualite_id = ? AND utilisateur_id = ?", [
      actualiteId, utilisateur.id,
    ]);
    aime = false;
  } else {
    await execute("INSERT IGNORE INTO actualites_likes (actualite_id, utilisateur_id) VALUES (?, ?)", [
      actualiteId, utilisateur.id,
    ]);
    aime = true;
  }
  const total = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM actualites_likes WHERE actualite_id = ?",
    [actualiteId],
  );
  return { aime, total: Number(total[0]?.n ?? 0) };
}

const nettoyerCommentaire = (t: string) =>
  t.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\n{3,}/g, "\n\n").trim();

export async function commenter(
  actualiteId: number,
  langue: Langue,
  _prev: EtatActualite,
  formData: FormData,
): Promise<EtatActualite> {
  const m = MESSAGES[estLangue(langue) ? langue : "fr"];
  const utilisateur = await getCurrentUser();
  if (!utilisateur) return { erreur: m.connexion };
  if (!(await actualitePubliee(actualiteId))) return { erreur: m.disparue };

  const texte = nettoyerCommentaire(String(formData.get("texte") ?? ""));
  if (texte.length < 2) return { erreur: m.court };
  if (texte.length > 1000) return { erreur: m.long };
  if (!estSousLimite(`commentaire:${utilisateur.id}`, 5, 10 * 60 * 1000)) {
    return { erreur: m.vite };
  }

  await execute(
    "INSERT INTO actualites_commentaires (actualite_id, utilisateur_id, texte) VALUES (?, ?, ?)",
    [actualiteId, utilisateur.id, texte],
  );
  rafraichir();
  return { succes: m.merci };
}

// L'auteur retire son commentaire ; l'administration peut retirer n'importe lequel.
export async function retirerCommentaire(commentaireId: number): Promise<void> {
  const utilisateur = await getCurrentUser();
  if (!utilisateur) return;
  const rows = await query<{ utilisateur_id: number }>(
    "SELECT utilisateur_id FROM actualites_commentaires WHERE id = ? LIMIT 1",
    [commentaireId],
  );
  if (!rows[0]) return;
  if (utilisateur.role !== "admin" && rows[0].utilisateur_id !== utilisateur.id) return;
  await execute("UPDATE actualites_commentaires SET statut = 'masque' WHERE id = ?", [commentaireId]);
  rafraichir();
}

// ─── Administration ──────────────────────────────────────────────────────────

export async function collecterMaintenant(
  _prev: EtatActualite,
  _formData: FormData,
): Promise<EtatActualite> {
  await exigerAdmin();
  try {
    const r = await collecterActualites({ budgetMs: 50_000 });
    rafraichir();
    const ia =
      r.ia === "active" ? "tri par l'IA" : r.ia === "en_panne" ? "IA indisponible, tri par mots-clés" : "sans IA, tri par mots-clés";
    const erreurs = r.erreurs.length
      ? ` ${r.erreurs.length} source(s) en erreur : ${r.erreurs.map((e) => e.source).slice(0, 4).join(", ")}.`
      : "";
    return {
      succes: `${r.publiees} publiée(s) sur ${r.nouvelles} nouveauté(s) repérée(s) dans ${r.lues} publications (${ia}, ${Math.round(r.duree_ms / 1000)} s).${r.reportees ? ` ${r.reportees} reportée(s) à la prochaine collecte.` : ""}${erreurs}`,
    };
  } catch (erreur) {
    console.error("[ArTova] Collecte des actualités :", erreur);
    return { erreur: `La collecte a échoué : ${erreur instanceof Error ? erreur.message : "erreur inconnue"}` };
  }
}

const dateIso = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "Date invalide.");

const schemaPublication = z.object({
  id: z.coerce.number().int().positive().optional(),
  titre: z.string().trim().min(5, "Le titre est trop court.").max(300, "Le titre est trop long."),
  resume: z.string().trim().min(20, "Le résumé doit faire au moins 20 caractères.").max(600, "Le résumé dépasse 600 caractères."),
  contenu: z.string().trim().max(20000, "Le texte est trop long.").optional().or(z.literal("")),
  source_nom: z.string().trim().min(1, "Indiquez la source.").max(120),
  url_source: z.string().trim().max(1000).optional().or(z.literal("")),
  portee: z.string().refine(estPortee, "Choisissez le Togo, l'Afrique ou le monde."),
  categorie: z.string().refine(estCategorie, "Choisissez une catégorie."),
  evenement_debut: dateIso,
  evenement_fin: dateIso,
  lieu: z.string().trim().max(160, "Le lieu est trop long.").optional().or(z.literal("")),
  videos: z.string().trim().max(2000, "Trop d'adresses de vidéos.").optional().or(z.literal("")),
  images: z.string().trim().max(4000, "Trop d'adresses d'images.").optional().or(z.literal("")),
  credit_image: z.string().trim().max(160).optional().or(z.literal("")),
  noms: z.string().trim().max(2000).optional().or(z.literal("")),
  titre_en: z.string().trim().max(300).optional().or(z.literal("")),
  resume_en: z.string().trim().max(600).optional().or(z.literal("")),
  contenu_en: z.string().trim().max(20000).optional().or(z.literal("")),
  titre_de: z.string().trim().max(300).optional().or(z.literal("")),
  resume_de: z.string().trim().max(600).optional().or(z.literal("")),
  contenu_de: z.string().trim().max(20000).optional().or(z.literal("")),
  artiste_slug: z.string().trim().max(120).optional().or(z.literal("")),
});

// Crée une actualité à la main, ou modifie une actualité existante (champ « id »).
export async function publierManuellement(
  _prev: EtatActualite,
  formData: FormData,
): Promise<EtatActualite> {
  await exigerAdmin();
  const parse = schemaPublication.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    titre: String(formData.get("titre") ?? ""),
    resume: String(formData.get("resume") ?? ""),
    contenu: String(formData.get("contenu") ?? ""),
    source_nom: String(formData.get("source_nom") ?? "") || "ArTova",
    url_source: String(formData.get("url_source") ?? ""),
    portee: String(formData.get("portee") ?? ""),
    categorie: String(formData.get("categorie") ?? ""),
    evenement_debut: String(formData.get("evenement_debut") ?? ""),
    evenement_fin: String(formData.get("evenement_fin") ?? ""),
    lieu: String(formData.get("lieu") ?? ""),
    videos: String(formData.get("videos") ?? ""),
    images: String(formData.get("images") ?? ""),
    credit_image: String(formData.get("credit_image") ?? ""),
    noms: String(formData.get("noms") ?? ""),
    titre_en: String(formData.get("titre_en") ?? ""),
    resume_en: String(formData.get("resume_en") ?? ""),
    contenu_en: String(formData.get("contenu_en") ?? ""),
    titre_de: String(formData.get("titre_de") ?? ""),
    resume_de: String(formData.get("resume_de") ?? ""),
    contenu_de: String(formData.get("contenu_de") ?? ""),
    artiste_slug: String(formData.get("artiste_slug") ?? ""),
  });
  if (!parse.success) return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  const d = parse.data;
  if (d.url_source && !adresseSure(d.url_source)) {
    return { erreur: "Le lien de la source doit commencer par https://." };
  }
  const lignesVideos = (d.videos ?? "").split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (lignesVideos.length > 6) return { erreur: "Six vidéos au plus par actualité." };
  const refusee = lignesVideos.find((l) => !lireVideo(l));
  if (refusee) {
    return {
      erreur: `Adresse de vidéo non reconnue : ${refusee.slice(0, 80)}. Collez le lien complet d'une vidéo TikTok (…/video/123…), d'une publication ou d'un reel Instagram, ou d'une vidéo YouTube.`,
    };
  }
  const lignesImages = (d.images ?? "").split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (lignesImages.length > 8) return { erreur: "Huit photos au plus par actualité." };
  const imageRefusee = lignesImages.find((l) => !/^(https:\/\/|\/fichiers\/)/.test(l));
  if (imageRefusee) {
    return { erreur: `Adresse d'image non reconnue : ${imageRefusee.slice(0, 80)}. Utilisez un lien https:// ou une image déjà envoyée sur ArTova.` };
  }
  // Noms cités (un par ligne) : chaque nom devient un tag ; ceux qui correspondent à
  // un artiste ArTova (même identifiant de page) renvoient à sa page.
  const noms = [...new Set((d.noms ?? "").split(/[\r\n]+/).map((n) => nettoyerHtml(n).slice(0, 80)).filter((n) => n.length >= 2))].slice(0, 20);
  const slugsNoms = noms.map((n) => slugTag(n)).filter(Boolean);
  const artistesTrouves = slugsNoms.length
    ? await query<{ slug: string }>(
        `SELECT slug FROM artistes WHERE statut = 'publie' AND slug IN (${slugsNoms.map(() => "?").join(",")})`,
        slugsNoms,
      )
    : [];
  const slugsArtistes = new Set(artistesTrouves.map((r) => r.slug));
  const personnesJson = noms.length
    ? JSON.stringify(noms.map((nom) => ({ nom, slug: slugsArtistes.has(slugTag(nom)) ? slugTag(nom) : null })))
    : null;
  const traduction = (langue: "en" | "de") => {
    const titre = d[`titre_${langue}`] ?? "";
    const resume = d[`resume_${langue}`] ?? "";
    const contenu = d[`contenu_${langue}`] ?? "";
    return titre || resume || contenu ? { titre, resume, contenu } : null;
  };
  const traductions = { en: traduction("en"), de: traduction("de") };
  const traductionsJson =
    traductions.en || traductions.de
      ? JSON.stringify(Object.fromEntries(Object.entries(traductions).filter(([, v]) => v)))
      : null;
  if (d.artiste_slug) {
    const trouve = await query<{ slug: string }>("SELECT slug FROM artistes WHERE slug = ? LIMIT 1", [d.artiste_slug]);
    if (!trouve[0]) return { erreur: "Cet artiste ArTova n'existe pas." };
  }
  if (d.evenement_fin && !d.evenement_debut) return { erreur: "Indiquez aussi la date de début." };
  if (d.evenement_fin && d.evenement_fin < d.evenement_debut) {
    return { erreur: "La date de fin précède la date de début." };
  }

  let image: string | null = null;
  const fichier = formData.get("image") as File | null;
  if (fichier && fichier.size > 0) {
    image = await saveUpload(fichier, "actualite");
    if (!image) return { erreur: `Image : ${MESSAGE_IMAGE_INVALIDE}` };
  }

  const valeurs = [
    nettoyerHtml(d.titre), nettoyerHtml(d.resume), d.contenu || null, d.url_source || null,
    nettoyerHtml(d.source_nom), d.portee, d.categorie, formData.get("a_la_une") === "1" ? 1 : 0,
    d.evenement_debut || null, d.evenement_fin || null, d.lieu ? nettoyerHtml(d.lieu) : null,
    lignesVideos.join("\n") || null, d.artiste_slug || null,
    lignesImages.join("\n") || null, d.credit_image ? nettoyerHtml(d.credit_image) : null, personnesJson, traductionsJson,
  ];

  if (d.id) {
    await execute(
      `UPDATE actualites SET titre=?, resume=?, contenu=?, url_source=?, source_nom=?, portee=?, categorie=?,
       a_la_une=?, evenement_debut=?, evenement_fin=?, lieu=?, videos=?, artiste_slug=?, images=?, credit_image=?, personnes=?, traductions=? ${image ? ", image_url=?" : ""} WHERE id=?`,
      image ? [...valeurs, image, d.id] : [...valeurs, d.id],
    );
    await poserTags(d.id, personnesJson);
    rafraichir();
    return { succes: "Actualité modifiée." };
  }

  const cree = await execute(
    `INSERT INTO actualites
     (empreinte, titre, resume, contenu, url_source, source_nom, portee, categorie, importance, a_la_une,
      evenement_debut, evenement_fin, lieu, videos, artiste_slug, images, credit_image, personnes, traductions, image_url, origine)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 8, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manuel')`,
    [createHash("sha1").update(`manuel:${randomUUID()}`).digest("hex"), ...valeurs, image],
  );
  if (personnesJson && cree.insertId) await poserTags(Number(cree.insertId), personnesJson);
  rafraichir();
  return { succes: "Actualité publiée." };
}

export async function basculerStatutActualite(id: number): Promise<void> {
  await exigerAdmin();
  await execute(
    "UPDATE actualites SET statut = IF(statut = 'publie', 'masque', 'publie') WHERE id = ?",
    [id],
  );
  rafraichir();
}

export async function basculerALaUne(id: number): Promise<void> {
  await exigerAdmin();
  await execute("UPDATE actualites SET a_la_une = IF(a_la_une = 1, 0, 1) WHERE id = ?", [id]);
  rafraichir();
}

export async function supprimerActualite(id: number): Promise<void> {
  await exigerAdmin();
  await execute("DELETE FROM actualites_likes WHERE actualite_id = ?", [id]);
  await execute("DELETE FROM actualites_commentaires WHERE actualite_id = ?", [id]);
  // L'empreinte reste dans actualites_vues : la publication ne reviendra pas.
  await execute("DELETE FROM actualites WHERE id = ?", [id]);
  rafraichir();
}

const schemaSource = z.object({
  nom: z.string().trim().min(2, "Donnez un nom à la source.").max(120),
  url_flux: z.string().trim().max(255, "Adresse trop longue."),
  portee: z.string().refine(estPortee, "Choisissez le Togo, l'Afrique ou le monde."),
  langue: z.enum(["fr", "en"]),
});

export async function ajouterSource(
  _prev: EtatActualite,
  formData: FormData,
): Promise<EtatActualite> {
  await exigerAdmin();
  const parse = schemaSource.safeParse({
    nom: String(formData.get("nom") ?? ""),
    url_flux: String(formData.get("url_flux") ?? ""),
    portee: String(formData.get("portee") ?? ""),
    langue: String(formData.get("langue") ?? "fr"),
  });
  if (!parse.success) return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  const d = parse.data;
  if (!adresseSure(d.url_flux)) return { erreur: "L'adresse du flux doit commencer par https://." };

  const ajout = await execute(
    "INSERT IGNORE INTO sources_actualites (nom, url_flux, portee, langue, filtrer) VALUES (?, ?, ?, ?, ?)",
    [d.nom, d.url_flux, d.portee, d.langue, formData.get("filtrer") === "1" ? 1 : 0],
  );
  if (ajout.affectedRows === 0) return { erreur: "Cette source est déjà dans la liste." };
  rafraichir();
  return { succes: `${d.nom} sera lue à la prochaine collecte.` };
}

export async function basculerSource(id: number): Promise<void> {
  await exigerAdmin();
  await execute("UPDATE sources_actualites SET actif = IF(actif = 1, 0, 1) WHERE id = ?", [id]);
  rafraichir();
}

export async function supprimerSource(id: number): Promise<void> {
  await exigerAdmin();
  await execute("DELETE FROM sources_actualites WHERE id = ?", [id]);
  rafraichir();
}
