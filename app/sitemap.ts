import type { MetadataRoute } from "next";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://artova-fin-production.up.railway.app";

// Pages accessibles sans compte : accueil, artistes publiés et leurs œuvres
// (le prix et la commande restent réservés aux membres).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const maintenant = new Date();
  const [artistes, oeuvres] = await Promise.all([
    query<{ slug: string }>("SELECT slug FROM artistes WHERE statut = 'publie' ORDER BY id"),
    query<{ id: number }>(
      `SELECT o.id FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
       WHERE a.statut = 'publie' ORDER BY o.id`,
    ),
  ]);
  return [
    { url: `${SITE_URL}/`, lastModified: maintenant, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/artistes`, lastModified: maintenant, changeFrequency: "weekly", priority: 0.9 },
    ...artistes.map((a) => ({
      url: `${SITE_URL}/artistes/${a.slug}`,
      lastModified: maintenant,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...oeuvres.map((o) => ({
      url: `${SITE_URL}/oeuvres/${o.id}`,
      lastModified: maintenant,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/inscription?profil=artiste`,
      lastModified: maintenant,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${SITE_URL}/inscription`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/connexion`, lastModified: maintenant, changeFrequency: "yearly", priority: 0.3 },
  ];
}
