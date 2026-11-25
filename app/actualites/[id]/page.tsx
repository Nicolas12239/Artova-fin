import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VueArticle } from "@/components/VueArticle";
import { getCurrentUser } from "@/lib/auth";
import {
  CATEGORIES,
  aAime,
  actualiteParId,
  actualitesLiees,
  commentairesActualite,
  idDepuisLien,
  lienActualite,
} from "@/lib/actualites";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numero = idDepuisLien(id);
  const a = numero ? await actualiteParId(numero) : null;
  if (!a || a.statut !== "publie") return { title: "Actualité introuvable", robots: { index: false } };
  return {
    title: a.titre,
    description: a.resume,
    alternates: { canonical: lienActualite(a) },
    openGraph: {
      type: "article",
      title: a.titre,
      description: a.resume,
      publishedTime: new Date(a.publie_le).toISOString(),
      section: CATEGORIES[a.categorie],
      images: a.image_url ? [{ url: a.image_url }] : undefined,
    },
    twitter: { card: a.image_url ? "summary_large_image" : "summary", title: a.titre, description: a.resume },
  };
}

export default async function PageActualite({ params }: Props) {
  const { id } = await params;
  const numero = idDepuisLien(id);
  const a = numero ? await actualiteParId(numero) : null;
  if (!a) notFound();

  const utilisateur = await getCurrentUser();
  if (a.statut !== "publie" && utilisateur?.role !== "admin") notFound();

  const chemin = lienActualite(a);
  const [commentaires, liees, aime] = await Promise.all([
    commentairesActualite(a.id),
    actualitesLiees(a, 3),
    utilisateur ? aAime(a.id, utilisateur.id) : Promise.resolve(false),
  ]);

  const site = process.env.SITE_URL || "https://artova-fin.vercel.app";
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.titre,
    description: a.resume,
    datePublished: new Date(a.publie_le).toISOString(),
    mainEntityOfPage: `${site}${chemin}`,
    image: a.image_url ? [a.image_url] : undefined,
    publisher: { "@type": "Organization", name: "ArTova", url: site },
    ...(a.url_source ? { isBasedOn: a.url_source, sourceOrganization: { "@type": "Organization", name: a.source_nom } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      <VueArticle
        a={a}
        chemin={chemin}
        utilisateur={utilisateur ? { id: utilisateur.id, role: utilisateur.role } : null}
        commentaires={commentaires}
        liees={liees}
        aime={aime}
      />
    </>
  );
}
