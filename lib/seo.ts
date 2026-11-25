import type { Metadata } from "next";
import { NOM_SITE, SITE_URL, urlAbsolue } from "./site";

// Raccourcit un texte sans couper un mot, pour une balise description (≈ 155 signes).
export function descriptionCourte(texte: string | null | undefined, max = 155): string {
  const propre = (texte ?? "").replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > max * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

export const DISCIPLINES_SEO = {
  peintre: { singulier: "peintre togolais", pluriel: "peintres togolais", metier: "Peintre" },
  plasticien: { singulier: "plasticien togolais", pluriel: "plasticiens togolais", metier: "Plasticien" },
  sculpteur: { singulier: "sculpteur togolais", pluriel: "sculpteurs togolais", metier: "Sculpteur" },
} as const;

export type DisciplineSeo = keyof typeof DISCIPLINES_SEO;

export function estDisciplineSeo(valeur: string): valeur is DisciplineSeo {
  return Object.hasOwn(DISCIPLINES_SEO, valeur);
}

// Fil d'Ariane au format schema.org : repris par Google sous le titre du résultat.
export function filAriane(elements: { nom: string; chemin: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.nom,
      item: urlAbsolue(e.chemin),
    })),
  };
}

// Métadonnées d'une page : titre, description, adresse canonique, aperçu de partage.
export function metadonnees({
  titre,
  description,
  chemin,
  image,
  type = "website",
}: {
  titre: string;
  description: string;
  chemin: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
}): Metadata {
  const images = image ? [{ url: urlAbsolue(image) }] : undefined;
  return {
    title: titre,
    description,
    alternates: { canonical: chemin },
    openGraph: { type: type === "profile" ? "profile" : type, title: titre, description, url: urlAbsolue(chemin), siteName: NOM_SITE, locale: "fr_FR", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: titre, description, images: images?.map((i) => i.url) },
  };
}

export { SITE_URL };
