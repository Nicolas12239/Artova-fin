import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtistCard } from "@/components/Cards";
import { query } from "@/lib/db";
import { DISCIPLINES_SEO, filAriane, metadonnees, type DisciplineSeo } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Artiste } from "@/lib/types";

// Adresses lisibles (/art-togolais/peintres) associées à la discipline en base.
const PAGES: Record<string, { discipline: DisciplineSeo; intro: string }> = {
  peintres: {
    discipline: "peintre",
    intro:
      "Acrylique, huile, techniques mixtes : les peintres togolais racontent Lomé, la mémoire, les corps et les couleurs. Découvrez leurs univers, leurs parcours et leurs toiles originales.",
  },
  sculpteurs: {
    discipline: "sculpteur",
    intro:
      "Bois, métal, pierre, matériaux de récupération : les sculpteurs togolais donnent forme à la matière. Découvrez leurs parcours et leurs sculptures originales.",
  },
  plasticiens: {
    discipline: "plasticien",
    intro:
      "Collage, installation, assemblage, matières mêlées : les plasticiens togolais décloisonnent les techniques. Découvrez leurs univers et leurs créations.",
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((discipline) => ({ discipline }));
}

type Props = { params: Promise<{ discipline: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { discipline } = await params;
  const page = PAGES[discipline];
  if (!page) return { title: "Page introuvable", robots: { index: false } };
  const d = DISCIPLINES_SEO[page.discipline];
  const maj = d.pluriel.charAt(0).toUpperCase() + d.pluriel.slice(1);
  return metadonnees({
    titre: `${maj} : artistes et œuvres originales`,
    description: `${page.intro.split(".")[0]}. ${maj} à découvrir sur ArTova, avec leurs œuvres à commander depuis Lomé.`,
    chemin: `/art-togolais/${discipline}`,
  });
}

export default async function PageDiscipline({ params }: Props) {
  const { discipline } = await params;
  const page = PAGES[discipline];
  if (!page) notFound();
  const d = DISCIPLINES_SEO[page.discipline];
  const maj = d.pluriel.charAt(0).toUpperCase() + d.pluriel.slice(1);

  const artistes = await query<Artiste>(
    "SELECT * FROM artistes WHERE statut = 'publie' AND discipline = ? ORDER BY id",
    [page.discipline],
  );

  const donneesStructurees = [
    filAriane([
      { nom: "Accueil", chemin: "/" },
      { nom: "Art togolais", chemin: "/art-togolais" },
      { nom: maj, chemin: `/art-togolais/${discipline}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${maj} sur ArTova`,
      itemListElement: artistes.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/artistes/${a.slug}`,
        name: a.nom,
      })),
    },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 md:px-8 md:pt-14">
          <nav aria-label="Fil d'Ariane" className="font-condense text-[14px] font-semibold uppercase tracking-[0.08em] text-gris">
            <Link href="/" className="hover:text-encre">Accueil</Link> /{" "}
            <Link href="/art-togolais" className="hover:text-encre">Art togolais</Link> / <span className="text-encre">{maj}</span>
          </nav>
          <h1 className="mt-4 font-condense text-[3.4rem] font-bold uppercase leading-[0.92] sm:text-7xl md:text-[6.5rem]">{maj}</h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-encre/80">{page.intro}</p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8 md:py-20">
        {artistes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {artistes.map((a) => (
              <ArtistCard key={a.id} artiste={a} />
            ))}
          </div>
        ) : (
          <p className="border border-fil bg-craie px-6 py-14 text-center text-gris">
            Aucun artiste dans cette catégorie pour le moment.{" "}
            <Link href="/inscription?profil=artiste" className="text-encre underline underline-offset-4">
              Vous êtes artiste ? Rejoignez ArTova.
            </Link>
          </p>
        )}
        <p className="mt-14 text-sm text-gris">
          Voir aussi :{" "}
          {Object.entries(PAGES)
            .filter(([cle]) => cle !== discipline)
            .map(([cle, p], i) => (
              <span key={cle}>
                {i > 0 && " · "}
                <Link href={`/art-togolais/${cle}`} className="text-encre underline underline-offset-4 hover:text-terracotta">
                  {DISCIPLINES_SEO[p.discipline].pluriel}
                </Link>
              </span>
            ))}
          {" · "}
          <Link href="/actualites/agenda" className="text-encre underline underline-offset-4 hover:text-terracotta">
            agenda des expositions à Lomé
          </Link>
        </p>
      </div>
    </div>
  );
}
