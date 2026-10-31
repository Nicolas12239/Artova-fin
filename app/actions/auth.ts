"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import {
  closeSession,
  getCurrentUser,
  hashPassword,
  openSession,
  verifyPassword,
} from "@/lib/auth";
import { estSousLimite } from "@/lib/rate-limit";
import { slugUnique } from "@/lib/artistes";
import {
  schemaConnexion,
  schemaInscription,
  schemaOeuvre,
  schemaPageArtiste,
} from "@/lib/validation";
import { MESSAGE_IMAGE_INVALIDE, saveUpload } from "@/lib/upload";
import { sendNouvelArtisteEmail } from "@/lib/email";
import { sendNouvelArtistePush } from "@/lib/ntfy";
import { COMMISSION_ARTOVA, LIBELLE_DISCIPLINE } from "@/lib/types";
import type { Utilisateur } from "@/lib/types";

export type EtatAuth = { erreur: string } | null;

function nextSur(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

async function cleRateLimit(email: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local";
  return `connexion:${ip}:${email.toLowerCase()}`;
}

export async function connecter(
  _prev: EtatAuth,
  formData: FormData,
): Promise<EtatAuth> {
  const brut = {
    email: String(formData.get("email") ?? ""),
    motDePasse: String(formData.get("mot_de_passe") ?? ""),
  };
  const parse = schemaConnexion.safeParse(brut);
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const { email, motDePasse } = parse.data;

  if (!estSousLimite(await cleRateLimit(email), 6, 15 * 60 * 1000)) {
    return {
      erreur:
        "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
    };
  }

  const rows = await query<Utilisateur>(
    "SELECT id, nom, email, mot_de_passe_hash, telephone, role, cree_le FROM utilisateurs WHERE email = ? LIMIT 1",
    [email.toLowerCase()],
  );
  const utilisateur = rows[0];
  if (utilisateur && !utilisateur.mot_de_passe_hash) {
    return {
      erreur:
        "Ce compte a été créé avec Google ou Apple : utilisez le bouton correspondant ci-dessus.",
    };
  }
  if (!utilisateur || !verifyPassword(motDePasse, utilisateur.mot_de_passe_hash)) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  await openSession({ id: utilisateur.id, role: utilisateur.role });
  const next = nextSur(formData.get("next"));
  redirect(next === "/" && utilisateur.role === "artiste" ? "/espace-artiste" : next);
}

export async function inscrire(
  _prev: EtatAuth,
  formData: FormData,
): Promise<EtatAuth> {
  const brut = {
    nom: String(formData.get("nom") ?? ""),
    email: String(formData.get("email") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    motDePasse: String(formData.get("mot_de_passe") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  };
  const parse = schemaInscription.safeParse(brut);
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const { nom, email, motDePasse, telephone } = parse.data;

  const existants = await query<{ id: number }>(
    "SELECT id FROM utilisateurs WHERE email = ? LIMIT 1",
    [email.toLowerCase()],
  );
  if (existants.length > 0) {
    return { erreur: "Un compte existe déjà avec cette adresse email." };
  }

  const result = await execute(
    "INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, role) VALUES (?, ?, ?, ?, 'client')",
    [nom, email.toLowerCase(), hashPassword(motDePasse), telephone || null],
  );
  const utilisateurId = Number(result.insertId);

  await openSession({ id: utilisateurId, role: "client" });
  redirect(nextSur(formData.get("next")));
}

function texte(formData: FormData, cle: string): string {
  return String(formData.get(cle) ?? "");
}

// Inscription artiste : compte, page complète et première œuvre en un seul
// envoi. La page part directement en validation auprès de l'équipe ArTova.
export async function inscrireArtiste(
  _prev: { erreur?: string } | null,
  formData: FormData,
): Promise<{ erreur?: string } | null> {
  const nom = texte(formData, "nom");
  // Déjà connecté (Google, Apple ou lien e-mail) : le compte existant devient
  // un compte artiste. Sinon, le formulaire contient aussi email et mot de passe.
  const courant = await getCurrentUser();
  if (courant && courant.role !== "client") {
    return { erreur: "Ce compte ne peut pas créer de page d'artiste." };
  }
  let compte: { email: string; telephone: string; motDePasse: string | null };
  if (courant) {
    const telephone = texte(formData, "telephone").trim();
    if (!/^[+0-9 ().\-]{8,40}$/.test(telephone)) {
      return { erreur: "Indiquez un numéro de téléphone valide pour être joint lors d'une commande." };
    }
    compte = { email: courant.email, telephone, motDePasse: null };
  } else {
    const parse = schemaInscription.safeParse({
      nom,
      email: texte(formData, "email"),
      telephone: texte(formData, "telephone"),
      motDePasse: texte(formData, "mot_de_passe"),
      confirmation: texte(formData, "confirmation"),
    });
    if (!parse.success) {
      return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
    }
    if (!parse.data.telephone) {
      return { erreur: "Indiquez un numéro de téléphone pour être joint lors d'une commande." };
    }
    compte = { email: parse.data.email, telephone: parse.data.telephone, motDePasse: parse.data.motDePasse };
  }

  const page = schemaPageArtiste.safeParse({
    nom,
    discipline: texte(formData, "discipline"),
    ville: texte(formData, "ville"),
    histoire: texte(formData, "histoire"),
    note_univers: texte(formData, "note_univers"),
    theme_primaire: texte(formData, "theme_primaire"),
    theme_accent: texte(formData, "theme_accent"),
    theme_fond: texte(formData, "theme_fond"),
    motif: texte(formData, "motif"),
    annee_debut: formData.get("annee_debut") ?? "",
    formation: texte(formData, "formation"),
    techniques: texte(formData, "techniques"),
    expositions: texte(formData, "expositions"),
  });
  if (!page.success) {
    return { erreur: page.error.issues[0]?.message ?? "Données invalides." };
  }

  const oeuvre = schemaOeuvre.safeParse({
    artiste_id: 1,
    titre: texte(formData, "titre"),
    type: texte(formData, "type"),
    prix_fcfa: formData.get("prix_fcfa") ?? "",
    annee: formData.get("annee") ?? "",
    dimensions: texte(formData, "dimensions"),
    technique: texte(formData, "technique"),
    description: texte(formData, "description"),
    oeuvre_maitre: true,
    statut: "disponible",
  });
  if (!oeuvre.success) {
    const message = oeuvre.error.issues[0]?.message ?? "Données invalides.";
    return { erreur: `Première œuvre : ${message}` };
  }

  if (formData.get("commission") !== "1") {
    return {
      erreur: `Vous devez accepter la commission ArTova de ${COMMISSION_ARTOVA} % pour créer votre page.`,
    };
  }

  const email = compte.email.toLowerCase();
  if (!courant) {
    const existants = await query<{ id: number }>(
      "SELECT id FROM utilisateurs WHERE email = ? LIMIT 1",
      [email],
    );
    if (existants.length > 0) {
      return { erreur: "Un compte existe déjà avec cette adresse email : connectez-vous d'abord." };
    }
  }

  const fichier = (cle: string) => formData.get(cle) as File | null;
  const portraitBrut = fichier("portrait");
  const imageBrute = fichier("image");
  if (!portraitBrut || portraitBrut.size === 0) {
    return { erreur: "Ajoutez un portrait : il présente votre page aux collectionneurs." };
  }
  if (!imageBrute || imageBrute.size === 0) {
    return { erreur: "Ajoutez la photo de votre première œuvre." };
  }
  const portrait = await saveUpload(portraitBrut, "artiste");
  if (!portrait) return { erreur: `Portrait : ${MESSAGE_IMAGE_INVALIDE}` };
  const image = await saveUpload(imageBrute, "oeuvre");
  if (!image) return { erreur: `Photo de l'œuvre : ${MESSAGE_IMAGE_INVALIDE}` };
  const banniereBrute = fichier("banniere");
  let banniere: string | null = null;
  if (banniereBrute && banniereBrute.size > 0) {
    banniere = await saveUpload(banniereBrute, "banniere");
    if (!banniere) return { erreur: `Bannière : ${MESSAGE_IMAGE_INVALIDE}` };
  }

  const p = page.data;
  const o = oeuvre.data;
  let utilisateurId: number;
  if (courant) {
    await execute("UPDATE utilisateurs SET role = 'artiste', telephone = ? WHERE id = ?", [
      compte.telephone,
      courant.id,
    ]);
    utilisateurId = courant.id;
  } else {
    const utilisateur = await execute(
      "INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, role) VALUES (?, ?, ?, ?, 'artiste')",
      [p.nom, email, hashPassword(compte.motDePasse ?? ""), compte.telephone],
    );
    utilisateurId = Number(utilisateur.insertId);
  }
  const artiste = await execute(
    `INSERT INTO artistes (slug, nom, discipline, ville, histoire, note_univers, theme_primaire,
     theme_accent, theme_fond, motif, portrait_url, banniere_url, annee_debut, formation,
     techniques, expositions, utilisateur_id, statut, commission_acceptee_le)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', NOW())`,
    [
      await slugUnique(p.nom), p.nom, p.discipline, p.ville || null, p.histoire,
      p.note_univers || null, p.theme_primaire, p.theme_accent, p.theme_fond, p.motif,
      portrait, banniere, p.annee_debut || null, p.formation || null, p.techniques || null,
      p.expositions || null, utilisateurId,
    ],
  );
  await execute(
    `INSERT INTO oeuvres (artiste_id, titre, type, prix_fcfa, annee, dimensions, technique,
     description, image_url, oeuvre_maitre, statut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'disponible')`,
    [
      Number(artiste.insertId), o.titre, o.type, o.prix_fcfa, o.annee || null,
      o.dimensions || null, o.technique || null, o.description, image,
    ],
  );

  // Alerte e-mail et notification push à l'équipe pour valider vite la page.
  const [alerteEmail, alertePush] = await Promise.allSettled([
    sendNouvelArtisteEmail({
      nom: p.nom,
      discipline: LIBELLE_DISCIPLINE[p.discipline],
      ville: p.ville || null,
      email,
      telephone: compte.telephone,
    }),
    sendNouvelArtistePush({
      nom: p.nom,
      discipline: LIBELLE_DISCIPLINE[p.discipline],
      ville: p.ville || null,
      motif: "inscription",
    }),
  ]);
  if (alerteEmail.status === "rejected") {
    console.error("[ArTova] Échec de l'e-mail nouvel artiste :", alerteEmail.reason);
  }
  if (alertePush.status === "rejected") {
    console.error("[ArTova] Échec de la notification nouvel artiste :", alertePush.reason);
  }

  await openSession({ id: utilisateurId, role: "artiste" });
  redirect("/espace-artiste?bienvenue=1");
}

export async function deconnecter(): Promise<void> {
  await closeSession();
  redirect("/");
}
