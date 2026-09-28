"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { execute, query } from "@/lib/db";
import {
  closeSession,
  hashPassword,
  openSession,
  verifyPassword,
} from "@/lib/auth";
import { estSousLimite } from "@/lib/rate-limit";
import { schemaConnexion, schemaInscription } from "@/lib/validation";
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
  if (!utilisateur || !verifyPassword(motDePasse, utilisateur.mot_de_passe_hash)) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  await openSession({ id: utilisateur.id, role: utilisateur.role });
  redirect(nextSur(formData.get("next")));
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

  await openSession({ id: Number(result.insertId), role: "client" });
  redirect("/");
}

export async function deconnecter(): Promise<void> {
  await closeSession();
  redirect("/");
}
