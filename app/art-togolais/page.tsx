import Link from "next/link";
import { ArtistCard } from "@/components/Cards";
import { CarteActualite } from "@/components/ActualiteCards";
import { query } from "@/lib/db";
import { listerActualites } from "@/lib/actualites";
import { DISCIPLINES_SEO, filAriane, metadonnees } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { COMMISSION_ARTOVA, type Artiste } from "@/lib/types";

export const metadata = metadonnees({
  titre: "Art togolais : peintres, sculpteurs et plasticiens du Togo",
  description:
    "Tout l'art togolais : artistes peintres, sculpteurs et plasticiens du Togo, leurs œuvres originales à commander depuis Lomé, les lieux à visiter, l'actualité et l'agenda des expositions.",
  chemin: "/art-togolais",
});

const LIEUX = [
  {
    nom: "Palais de Lomé",
    texte: "Centre d'art et de culture inauguré en 2019, qui présente des expositions d'art contemporain.",
  },
  {
    nom: "Musée Paul Ahyi, à Agnassan",
    texte:
      "Musée consacré à Paul Ahyi (1930-2010), figure majeure de l'art togolais, et centre d'art qui accueille des expositions et des résidences d'artistes.",
  },
  { nom: "Galerie ARTEMIS", texte: "Galerie de Lomé qui présente des expositions d'artistes d'ici et d'ailleurs." },
  { nom: "Galerie AF", texte: "Galerie d'art de Lomé." },
  {
    nom: "Nutafe Togo",
    texte: "Espace à Hédzranawoé qui réunit galerie d'art, centre de formation et boutique de matériel d'art.",
  },
  { nom: "Musée KIJAIN Art Contemporain", texte: "Musée d'art contemporain qui accueille des expositions d'artistes togolais." },
  { nom: "Institut français du Togo", texte: "Expositions d'artistes contemporains, de photographes et de vidéastes, et programmation culturelle." },
];

const QUESTIONS = [
  {
    q: "Qu'est-ce que l'art togolais ?",
    r: "L'art togolais regroupe la peinture, la sculpture, les arts plastiques et les créations visuelles des artistes du Togo, de la tradition aux démarches contemporaines. ArTova réunit des peintres, des sculpteurs et des plasticiens togolais et présente leurs œuvres originales.",
  },
  {
    q: "Où voir de l'art togolais à Lomé ?",
    r: "À Lomé, on peut voir des expositions au Palais de Lomé, au musée Paul Ahyi à Agnassan, à la galerie ARTEMIS, à la galerie AF, chez Nutafe Togo, au musée KIJAIN et à l'Institut français du Togo. L'agenda d'ArTova recense les expositions et vernissages en cours.",
  },
  {
    q: "Comment acheter une œuvre d'un artiste togolais ?",
    r: `Sur ArTova, on parcourt librement les artistes et leurs œuvres, on crée un compte pour voir les prix, puis on commande l'œuvre choisie. L'équipe met ensuite l'acheteur et l'artiste en relation pour la livraison et le règlement. ${100 - COMMISSION_ARTOVA} % du prix revient à l'artiste.`,
  },
  {
    q: "Comment suivre l'actualité des expositions au Togo ?",
    r: "La rubrique Actu art d'ArTova publie chaque jour l'actualité de l'art au Togo, en Afrique et dans le monde, avec un agenda des expositions, vernissages et rencontres à Lomé.",
  },
  {
    q: "Je suis artiste : comment présenter mes œuvres sur ArTova ?",
    r: "Il suffit de créer un compte artiste, de renseigner son parcours, d'ajouter un portrait et une première œuvre et d'accepter la commission d'ArTova. La page est ensuite validée par l'équipe avant publication.",
  },
];

export default async function PageArtTogolais() {
  const [artistes, actus] = await Promise.all([
    query<Artiste>("SELECT * FROM artistes WHERE statut = 'publie' ORDER BY id"),
    listerActualites({ portee: "togo" }, { limite: 3 }).catch(() => []),
  ]);

  const donneesStructurees = [
    filAriane([
      { nom: "Accueil", chemin: "/" },
      { nom: "Art togolais", chemin: "/art-togolais" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: QUESTIONS.map((x) => ({
        "@type": "Question",
        name: x.q,
        acceptedAnswer: { "@type": "Answer", text: x.r },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Artistes togolais sur ArTova",
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
            <Link href="/" className="hover:text-encre">Accueil</Link> / <span className="text-encre">Art togolais</span>
          </nav>
          <h1 className="mt-4 max-w-5xl font-condense text-[3rem] font-bold uppercase leading-[0.94] sm:text-6xl md:text-[5.5rem]">
            L&apos;art togolais : peintres, sculpteurs et plasticiens du Togo
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-encre/80">
            ArTova est la référence de l&apos;art togolais : des artistes, leurs histoires et leurs œuvres originales,
            à découvrir librement et à commander depuis Lomé. Retrouvez aussi les lieux à visiter, l&apos;actualité et
            l&apos;agenda des expositions.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {(Object.keys(DISCIPLINES_SEO) as (keyof typeof DISCIPLINES_SEO)[]).map((d) => (
              <li key={d}>
                <Link
                  href={`/art-togolais/${d === "peintre" ? "peintres" : d === "sculpteur" ? "sculpteurs" : "plasticiens"}`}
                  className="border border-encre px-4 py-2 font-condense text-base font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-encre hover:text-craie"
                >
                  {DISCIPLINES_SEO[d].pluriel}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/actualites/agenda"
                className="border border-terracotta bg-terracotta px-4 py-2 font-condense text-base font-semibold uppercase tracking-[0.06em] text-craie transition-colors hover:bg-encre"
              >
                Agenda des expositions
              </Link>
            </li>
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8 md:py-20">
        <section aria-labelledby="artistes">
          <h2 id="artistes" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
            Les artistes togolais sur ArTova
          </h2>
          {artistes.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {artistes.map((a) => (
                <ArtistCard key={a.id} artiste={a} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-gris">Les premiers artistes arrivent bientôt.</p>
          )}
        </section>

        <section aria-labelledby="lieux" className="mt-20">
          <h2 id="lieux" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
            Où voir de l&apos;art togolais à Lomé
          </h2>
          <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {LIEUX.map((l) => (
              <li key={l.nom} className="border-t border-fil pt-4">
                <h3 className="font-display text-2xl">{l.nom}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-gris">{l.texte}</p>
              </li>
            ))}
          </ul>
        </section>

        {actus.length > 0 && (
          <section aria-labelledby="actu" className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="actu" className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
                L&apos;actualité de l&apos;art au Togo
              </h2>
              <Link href="/actualites?portee=togo" className="font-condense text-base font-semibold uppercase tracking-[0.06em] underline underline-offset-4 hover:text-terracotta">
                Toute l&apos;actualité togolaise →
              </Link>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {actus.map((a) => (
                <CarteActualite key={a.id} a={a} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="faq" className="mt-20 max-w-3xl">
          <h2 id="faq" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
            Questions fréquentes
          </h2>
          <dl className="mt-8 divide-y divide-fil border-y border-fil">
            {QUESTIONS.map((x) => (
              <div key={x.q} className="py-6">
                <dt className="font-display text-2xl">{x.q}</dt>
                <dd className="mt-2 text-[16px] leading-relaxed text-encre/80">{x.r}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
