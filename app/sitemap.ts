import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://artova-fin-production.up.railway.app";

// Seules les pages accessibles sans compte sont référencées : les univers
// d'artistes et les œuvres sont réservés aux membres.
export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: maintenant, changeFrequency: "daily", priority: 1 },
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
