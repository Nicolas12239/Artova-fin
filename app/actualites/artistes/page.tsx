import type { Metadata } from "next";
import Link from "next/link";
import { NavActu } from "@/components/NavActu";
import { listeTags } from "@/lib/actualites";
import { TEXTES, avecLangue, langueDe, nombre } from "@/lib/actualites-i18n";

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const langue = langueDe((await searchParams).lang);
  const t = TEXTES[langue];
  return {
    title: t.artistesTitre,
    description: t.artistesIntro,
    alternates: {
      canonical: avecLangue("/actualites/artistes", langue),
      languages: {
        fr: "/actualites/artistes",
        en: "/actualites/artistes?lang=en",
        de: "/actualites/artistes?lang=de",
        "x-default": "/actualites/artistes",
      },
    },
  };
}

// Index alphabétique des personnes citées dans l'actualité.
export default async function PageArtistesCites({ searchParams }: Props) {
  const langue = langueDe((await searchParams).lang);
  const t = TEXTES[langue];
  const tags = await listeTags().catch(() => []);
  const parLettre = new Map<string, typeof tags>();
  for (const tag of [...tags].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))) {
    const lettre = tag.nom.trim().charAt(0).toUpperCase().normalize("NFD").replace(/\p{M}/gu, "") || "#";
    parLettre.set(/[A-Z]/.test(lettre) ? lettre : "#", [...(parLettre.get(/[A-Z]/.test(lettre) ? lettre : "#") ?? []), tag]);
  }
  const lettres = [...parLettre.keys()];

  return (
    <div lang={langue}>
      <NavActu langue={langue} active="artistes" chemin="/actualites/artistes" />
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 md:px-8 md:pt-10">
          <h1 className="font-condense text-[3.2rem] font-bold uppercase leading-[0.92] sm:text-7xl md:text-[6.5rem]">{t.artistesTitre}</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gris">{t.artistesIntro}</p>
          {lettres.length > 1 && (
            <nav aria-label="A–Z" className="mt-8 flex flex-wrap gap-1.5">
              {lettres.map((l) => (
                <a key={l} href={`#lettre-${l}`} className="flex h-9 w-9 items-center justify-center border border-fil font-condense text-lg font-bold hover:border-encre hover:bg-encre hover:text-craie">
                  {l}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8">
        {tags.length === 0 ? (
          <p className="border border-fil bg-craie px-6 py-14 text-center text-gris">{t.agendaVide}</p>
        ) : (
          lettres.map((l) => (
            <section key={l} id={`lettre-${l}`} className="scroll-mt-24 border-t border-fil py-8 first:border-t-0">
              <h2 className="font-condense text-5xl font-bold uppercase leading-none text-terracotta">{l}</h2>
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {(parLettre.get(l) ?? []).map((tag) => (
                  <li key={tag.slug}>
                    <Link href={avecLangue(`/actualites/artiste/${tag.slug}`, langue)} className="group flex items-baseline justify-between gap-4 border-b border-fil pb-2">
                      <span className="font-display text-2xl leading-tight decoration-1 underline-offset-4 group-hover:underline">{tag.nom}</span>
                      <span className="shrink-0 text-xs text-gris">{nombre(t.articlesNb, tag.nb)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
