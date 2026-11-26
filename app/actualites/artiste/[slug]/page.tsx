import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VueFichePersonne } from "@/components/VueFichePersonne";
import { tagParSlug } from "@/lib/actualites";
import { fichePersonne } from "@/lib/actualites-personnes";
import { TEXTES, avecLangue, fmt, langueDe, nombre } from "@/lib/actualites-i18n";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const langue = langueDe((await searchParams).lang);
  const tag = await tagParSlug(slug);
  if (!tag) return { title: "Introuvable", robots: { index: false } };
  const t = TEXTES[langue];
  const chemin = `/actualites/artiste/${slug}`;
  return {
    title: fmt(t.tagTitre, { nom: tag.nom }),
    description: `${fmt(t.tagIntro, { nom: tag.nom })} ${nombre(t.articlesNb, tag.nb)}.`,
    alternates: {
      canonical: avecLangue(chemin, langue),
      languages: { fr: chemin, en: avecLangue(chemin, "en"), de: avecLangue(chemin, "de"), "x-default": chemin },
    },
  };
}

export default async function PageTag({ params, searchParams }: Props) {
  const { slug } = await params;
  const langue = langueDe((await searchParams).lang);
  const fiche = await fichePersonne(slug, langue);
  if (!fiche) notFound();
  return <VueFichePersonne fiche={fiche} langue={langue} />;
}
