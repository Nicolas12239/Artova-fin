// Adresse publique du site : une seule source pour les métadonnées, le sitemap,
// robots.txt et les données structurées (SEO).
export const SITE_URL = (process.env.SITE_URL || "https://artova-fin.vercel.app").replace(/\/+$/, "");

export const NOM_SITE = "ArTova";

export function urlAbsolue(chemin: string): string {
  if (/^https?:\/\//i.test(chemin)) return chemin;
  return `${SITE_URL}${chemin.startsWith("/") ? "" : "/"}${chemin}`;
}
