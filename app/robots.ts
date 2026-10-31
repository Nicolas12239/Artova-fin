import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://artova-fin-production.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/compte", "/commande", "/espace-artiste"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
