"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendCommandeEmail } from "@/lib/email";
import { sendCommandeWhatsapp } from "@/lib/whatsapp";
import { sendCommandePush } from "@/lib/ntfy";
import { schemaCommande } from "@/lib/validation";
import type { OeuvreAvecArtiste } from "@/lib/types";

export type EtatCommande = { erreur: string } | null;

function nouvelleReference(): string {
  return `ART-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function passerCommande(
  oeuvreId: number,
  _prev: EtatCommande,
  formData: FormData,
): Promise<EtatCommande> {
  const utilisateur = await getCurrentUser();
  if (!utilisateur) redirect(`/connexion?next=/commande/${oeuvreId}`);

  const parse = schemaCommande.safeParse({
    telephone: String(formData.get("telephone") ?? ""),
    ville: String(formData.get("ville") ?? ""),
    adresse: String(formData.get("adresse") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Données invalides." };
  }
  const { telephone, ville, adresse, message } = parse.data;

  const oeuvres = await query<OeuvreAvecArtiste>(
    `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent
     FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
     WHERE o.id = ? AND a.statut = 'publie' LIMIT 1`,
    [oeuvreId],
  );
  const oeuvre = oeuvres[0];
  if (!oeuvre) return { erreur: "Œuvre introuvable." };
  if (oeuvre.statut !== "disponible") {
    return { erreur: "Cette œuvre n'est plus disponible à la commande." };
  }

  const reference = nouvelleReference();
  await execute(
    `INSERT INTO commandes (reference, utilisateur_id, oeuvre_id, statut, telephone, ville, adresse, message)
     VALUES (?, ?, ?, 'en_attente', ?, ?, ?, ?)`,
    [
      reference,
      utilisateur.id,
      oeuvre.id,
      telephone,
      ville,
      adresse || null,
      message || null,
    ],
  );
  await execute("UPDATE oeuvres SET statut = 'reserve' WHERE id = ?", [
    oeuvre.id,
  ]);

  // Email, push et WhatsApp partent en parallèle : l'échec de l'un n'empêche
  // ni les autres ni l'enregistrement de la commande.
  const [email, push, whatsapp] = await Promise.allSettled([
    sendCommandeEmail({
      reference,
      oeuvreTitre: oeuvre.titre,
      oeuvreType: oeuvre.type,
      prixFcfa: oeuvre.prix_fcfa,
      artisteNom: oeuvre.artiste_nom,
      clientNom: utilisateur.nom,
      clientEmail: utilisateur.email,
      telephone,
      ville,
      adresse: adresse || null,
      message: message || null,
    }),
    sendCommandePush({
      reference,
      oeuvreTitre: oeuvre.titre,
      artisteNom: oeuvre.artiste_nom,
      prixFcfa: oeuvre.prix_fcfa,
      clientNom: utilisateur.nom,
      ville,
    }),
    sendCommandeWhatsapp({
      reference,
      oeuvreTitre: oeuvre.titre,
      artisteNom: oeuvre.artiste_nom,
      prixFcfa: oeuvre.prix_fcfa,
      clientNom: utilisateur.nom,
      clientEmail: utilisateur.email,
      telephone,
      ville,
      adresse: adresse || null,
      message: message || null,
    }),
  ]);
  if (email.status === "rejected") {
    console.error("[ArTova] Échec d'envoi de l'email de commande :", email.reason);
  }
  if (push.status === "rejected") {
    console.error("[ArTova] Échec de la notification push de commande :", push.reason);
  }
  if (whatsapp.status === "rejected") {
    console.error("[ArTova] Échec de la notification WhatsApp de commande :", whatsapp.reason);
  }

  redirect(`/commande/confirmation/${reference}`);
}
