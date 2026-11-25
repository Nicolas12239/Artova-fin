import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { lienActualite } from "@/lib/actualites";
import { SITE_URL, urlAbsolue } from "@/lib/site";

export const dynamic = "force-dynamic";

// Pages accessibles sans compte : accueil, art togolais, artistes publiés et leurs
// œuvres, actualités et agenda (le prix et la commande restent réservés aux membres).
// Les images sont déclarées pour apparaître dans la recherche d'images.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const maintenant = new Date();
  const [artistes, oeuvres, actualites] = await Promise.all([
    query<{ slug: string; portrait_url: string | null }>(
      "SELECT slug, portrait_url FROM artistes WHERE statut = 'publie' ORDER BY id",
    ),
    query<{ id: number; image_url: string }>(
      `SELECT o.id, o.image_url FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
       WHERE a.statut = 'publie' ORDER BY o.id`,
    ),
    query<{ id: number; titre: string; publie_le: Date; image_url: string | null }>(
      "SELECT id, titre, publie_le, image_url FROM actualites WHERE statut = 'publie' ORDER BY publie_le DESC LIMIT 500",
    ).catch(() => []),
  ]);
  return [
    { url: `${SITE_URL}/`, lastModified: maintenant, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/art-togolais`, lastModified: maintenant, changeFrequency: "weekly", priority: 0.95 },
    ...["peintres", "sculpteurs", "plasticiens"].map((d) => ({
      url: `${SITE_URL}/art-togolais/${d}`,
      lastModified: maintenant,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    { url: `${SITE_URL}/artistes`, lastModified: maintenant, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/actualites`, lastModified: maintenant, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/actualites/agenda`, lastModified: maintenant, changeFrequency: "daily", priority: 0.9 },
    ...actualites.map((a) => ({
      url: `${SITE_URL}${lienActualite(a)}`,
      lastModified: new Date(a.publie_le),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: a.image_url ? [urlAbsolue(a.image_url)] : undefined,
    })),
    ...artistes.map((a) => ({
      url: `${SITE_URL}/artistes/${a.slug}`,
      lastModified: maintenant,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: a.portrait_url ? [urlAbsolue(a.portrait_url)] : undefined,
    })),
    ...oeuvres.map((o) => ({
      url: `${SITE_URL}/oeuvres/${o.id}`,
      lastModified: maintenant,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [urlAbsolue(o.image_url)],
    })),
    {
      url: `${SITE_URL}/inscription?profil=artiste`,
      lastModified: maintenant,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
