import { z } from "zod";

export const schemaInscription = z
  .object({
    nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(120),
    email: z.string().trim().email("Adresse email invalide.").max(190),
    telephone: z
      .string()
      .trim()
      .max(40)
      .regex(/^([+0-9 ().\-]+)?$/, "Numéro de téléphone invalide.")
      .optional()
      .or(z.literal("")),
    motDePasse: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères.")
      .max(120)
      .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
        message: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
      }),
    confirmation: z.string(),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });

export const schemaConnexion = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(190),
  motDePasse: z.string().min(1, "Mot de passe requis."),
});

export const schemaCommande = z.object({
  telephone: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone invalide.")
    .max(40)
    .regex(/^[+0-9 ().\-]+$/, "Numéro de téléphone invalide."),
  ville: z.string().trim().min(2, "Ville requise.").max(80),
  adresse: z.string().trim().max(255).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const schemaStatutCommande = z.enum([
  "en_attente",
  "confirmee",
  "expediee",
  "livree",
  "annulee",
]);

const couleurHex = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale attendue (#RRGGBB).");

export const schemaArtiste = z.object({
  id: z.coerce.number().int().positive().optional(),
  nom: z.string().trim().min(2).max(120),
  discipline: z.enum(["peintre", "plasticien", "sculpteur"]),
  ville: z.string().trim().max(80).optional().or(z.literal("")),
  histoire: z.string().trim().min(20, "L'histoire doit faire au moins 20 caractères."),
  note_univers: z.string().trim().max(255).optional().or(z.literal("")),
  theme_primaire: couleurHex,
  theme_accent: couleurHex,
  theme_fond: couleurHex,
  motif: z.enum(["pinceau", "collage", "pierre"]),
});

export const schemaOeuvre = z.object({
  id: z.coerce.number().int().positive().optional(),
  artiste_id: z.coerce.number().int().positive("Artiste requis."),
  titre: z.string().trim().min(2).max(160),
  type: z.enum(["toile", "sculpture"]),
  prix_fcfa: z.coerce
    .number()
    .int()
    .positive("Prix invalide.")
    .max(1_000_000_000, "Prix invalide."),
  annee: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  dimensions: z.string().trim().max(80).optional().or(z.literal("")),
  technique: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Description trop courte."),
  oeuvre_maitre: z.boolean().default(false),
  statut: z.enum(["disponible", "reserve", "vendu"]).default("disponible"),
});

export function slugifier(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
