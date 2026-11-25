import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarteActualite } from "@/components/ActualiteCards";
import { NavActu } from "@/components/NavActu";
import { actualitesDuTag, artistePourTag, tagParSlug } from "@/lib/actualites";
import { TEXTES, avecLangue, fmt, langueDe, nombre } from "@/lib/actualites-i18n";
import { SITE_URL, urlAbsolue } from "@/lib/site";

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
  const tag = await tagParSlug(slug);
  if (!tag) notFound();
  const [articles, artiste] = await Promise.all([actualitesDuTag(slug, 24), artistePourTag(slug)]);
  const t = TEXTES[langue];
  const chemin = `/actualites/artiste/${slug}`;

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: fmt(t.tagTitre, { nom: tag.nom }),
    inLanguage: langue,
    url: `${SITE_URL}${avecLangue(chemin, langue)}`,
    about: { "@type": "Person", name: tag.nom, url: artiste ? `${SITE_URL}/artistes/${artiste.slug}` : undefined },
    hasPart: articles.slice(0, 12).map((a) => ({ "@type": "NewsArticle", headline: a.titre, image: a.image_url ? [urlAbsolue(a.image_url)] : undefined })),
  };

  return (
    <div lang={langue}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }} />
      <NavActu langue={langue} active="artistes" chemin={chemin} />
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 md:px-8 md:pt-10">
          <nav aria-label={t.arianeAria} className="font-condense text-[14px] font-semibold uppercase tracking-[0.08em] text-gris">
            <Link href={avecLangue("/actualites", langue)} className="hover:text-encre">{t.actuArt}</Link> /{" "}
            <Link href={avecLangue("/actualites/artistes", langue)} className="hover:text-encre">{t.navArtistes}</Link> /{" "}
            <span className="text-encre">{tag.nom}</span>
          </nav>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            {artiste?.portrait_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artiste.portrait_url} alt={artiste.nom} className="h-28 w-28 object-cover" />
            )}
            <div>
              <h1 className="font-condense text-[3rem] font-bold uppercase leading-[0.95] sm:text-6xl md:text-[5rem]">#{tag.nom}</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gris">
                {fmt(t.tagIntro, { nom: tag.nom })} {nombre(t.articlesNb, tag.nb)}.
              </p>
              {artiste && (
                <Link href={`/artistes/${artiste.slug}`} className="mt-4 inline-block border-b border-terracotta pb-1 font-condense text-base font-semibold uppercase tracking-[0.07em] hover:text-terracotta">
                  {t.voirSaPage} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <CarteActualite key={a.id} a={a} langue={langue} />
          ))}
        </div>
      </div>
    </div>
  );
}
