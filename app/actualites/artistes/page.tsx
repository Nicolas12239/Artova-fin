import type { Metadata } from "next";
import { VueArtistesCites } from "@/components/VueArtistesCites";
import { resumesPersonnes } from "@/lib/actualites-personnes";
import { TEXTES, avecLangue, langueDe } from "@/lib/actualites-i18n";

type Props = { searchParams: Promise<{ lang?: string; q?: string }> };

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

export default async function PageArtistesCites({ searchParams }: Props) {
  const params = await searchParams;
  const langue = langueDe(params.lang);
  const q = (params.q ?? "").trim().slice(0, 60);
  const toutes = await resumesPersonnes().catch(() => []);
  return <VueArtistesCites toutes={toutes} q={q} langue={langue} />;
}
