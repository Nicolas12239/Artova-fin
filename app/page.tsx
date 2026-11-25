import Link from "next/link";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ArtworkCard, ArtistCard, ArtistesBientot } from "@/components/Cards";
import { CONTACT } from "@/components/Header";
import { VideoExplication } from "@/components/VideoExplication";
import { after } from "next/server";
import { CarteActualite } from "@/components/ActualiteCards";
import { actualiserSiBesoin } from "@/lib/actualites-actualiser";
import { SITE_URL } from "@/lib/site";
import { actualiteALaUne, listerActualites } from "@/lib/actualites";
import { COMMISSION_ARTOVA, type Artiste, type OeuvreAvecArtiste } from "@/lib/types";

export const metadata = {
  alternates: { canonical: "/" },
};

const PART_ARTISTE = 100 - COMMISSION_ARTOVA;

const SELECT_OEUVRES = `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent
  FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
  WHERE a.statut = 'publie'`;

const ETAPES = [
  {
    titre: "Parcourez",
    texte: "Les œuvres et les univers des artistes sont visibles par tous, sans compte.",
  },
  {
    titre: "Créez votre compte",
    texte: "Un compte suffit pour voir les prix et commander les œuvres qui vous parlent.",
  },
  {
    titre: "Commandez",
    texte: "Votre commande réserve l'œuvre et part à l'équipe ArTova avec vos coordonnées.",
  },
  {
    titre: "Rencontrez l'artiste",
    texte: `ArTova vous met en relation pour le règlement et la livraison. ${PART_ARTISTE} % du prix revient à l'artiste.`,
  },
];

// La collecte lancée en arrière-plan après la réponse peut durer jusqu'à une minute.
export const maxDuration = 60;

export default async function Accueil() {
  const utilisateur = await getCurrentUser();
  after(() => actualiserSiBesoin());
  const [oeuvres, artistes, vedetteActu] = await Promise.all([
    query<OeuvreAvecArtiste>(`${SELECT_OEUVRES} ORDER BY o.id DESC LIMIT 8`),
    query<Artiste>("SELECT * FROM artistes WHERE statut = 'publie' ORDER BY id"),
    actualiteALaUne().catch(() => null),
  ]);
  const autresActu = vedetteActu
    ? await listerActualites({}, { limite: 2, sauf: vedetteActu.id }).catch(() => [])
    : [];

  const site = SITE_URL;
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organisation`,
        name: "ArTova",
        url: site,
        logo: `${site}/icon.png`,
        email: CONTACT.email,
        description:
          "Plateforme de l'art togolais : peintres, plasticiens et sculpteurs du Togo, leurs histoires et leurs œuvres.",
        address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
        sameAs: [CONTACT.tiktok, CONTACT.instagram],
        areaServed: { "@type": "Country", name: "Togo" },
        knowsAbout: ["art togolais", "peinture", "sculpture", "arts plastiques", "art contemporain africain"],
        slogan: "La référence de l'art togolais",
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#site`,
        name: "ArTova",
        alternateName: "ArTova Togo",
        url: site,
        inLanguage: "fr",
        publisher: { "@id": `${site}/#organisation` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${site}/actualites?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />

      {/* Premier écran : la galerie en plein cadre, le titre posé sur la photo */}
      <section className="relative flex min-h-[560px] flex-col justify-end overflow-hidden bg-encre md:h-[calc(92svh-4rem)] md:max-h-[860px] md:justify-center">
        <img
          src="/images/hero.jpg"
          alt="Toiles d'artistes togolais accrochées dans une galerie baignée de lumière"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] md:object-center"
        />
        {/* Assombrit légèrement le bas sur mobile pour détacher le panneau */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-encre/45 via-transparent to-transparent md:hidden" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-4 pb-6 pt-40 sm:px-6 md:items-end md:px-8 md:py-0">
          <div className="w-full bg-craie/88 p-6 shadow-[0_24px_60px_rgba(27,26,23,0.18)] backdrop-blur-sm sm:p-8 md:max-w-[460px] md:p-10">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-5xl md:text-[3.6rem]">
                L’art togolais,
                <br />
                maintenant.
              </h1>
              <span className="mt-2 shrink-0 text-[10px] uppercase tracking-[0.22em] text-gris">
                Lomé
              </span>
            </div>
            <p className="mt-5 max-w-sm text-[12px] uppercase leading-relaxed tracking-[0.22em] text-encre/75">
              Révèle les peintres, plasticiens et sculpteurs du Togo
            </p>
          </div>
          <Link
            href="#oeuvres"
            className="group flex min-h-14 w-full items-center justify-between gap-6 bg-craie/88 px-6 font-display text-lg backdrop-blur-sm transition-colors hover:bg-encre hover:text-craie sm:px-8 md:max-w-[460px] md:px-10"
          >
            Aperçu de nos œuvres
            <span aria-hidden="true" className="h-4 w-1 bg-encre transition-colors group-hover:bg-terracotta" />
          </Link>
        </div>
      </section>

      {/* Trois arguments à la place du grand bloc logo */}
      <section className="border-b border-fil bg-craie">
        <ul className="mx-auto grid max-w-7xl md:grid-cols-3">
          {[
            ["Voir", "Les œuvres, leurs techniques et leurs dimensions, sans créer de compte."],
            ["Commander", "Réservez une œuvre en ligne, ArTova vous met en relation avec l'artiste."],
            ["Soutenir", `${PART_ARTISTE} % du prix de chaque vente revient directement à l'artiste.`],
          ].map(([titre, texte]) => (
            <li
              key={titre}
              className="border-b border-fil px-4 py-8 sm:px-6 md:border-b-0 md:border-r md:px-8 md:py-10 md:last:border-r-0"
            >
              <p className="font-display text-3xl">{titre}</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gris">{texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Les œuvres, visibles par tous ; le prix reste réservé aux membres */}
      <section id="oeuvres" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.22em] text-gris">Galerie</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Dernières œuvres</h2>
          </div>
          <Link
            href="/artistes"
            className="text-[13px] uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline"
          >
            Tous les artistes ↗
          </Link>
        </div>
        {oeuvres.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {oeuvres.map((oeuvre) => (
              <ArtworkCard key={oeuvre.id} oeuvre={oeuvre} afficherArtiste afficherPrix={!!utilisateur} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <ArtistesBientot />
          </div>
        )}
        {!utilisateur && oeuvres.length > 0 && (
          <p className="mt-8 text-sm text-gris">
            Les prix sont visibles avec un compte ArTova.{" "}
            <Link href="/inscription" className="text-encre underline underline-offset-4 hover:no-underline">
              Créer mon compte ↗
            </Link>
          </p>
        )}
      </section>

      {/* L'actualité de l'art : lecture libre, mise à jour chaque matin */}
      {vedetteActu && (
        <section className="border-y border-fil bg-craie">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl md:text-5xl">L&apos;actualité de l&apos;art</h2>
              <Link
                href="/actualites"
                className="text-[13px] uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline"
              >
                Toute l&apos;actualité ↗
              </Link>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gris">
              Le Togo, l&apos;Afrique et le monde de l&apos;art, trié chaque matin. Sans compte.
            </p>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {[vedetteActu, ...autresActu].map((a) => (
                <CarteActualite key={a.id} a={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explorer : maillage vers les pages de référence sur l'art togolais */}
      <section aria-label="Explorer l'art togolais" className="border-b border-fil bg-creme">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6 font-condense text-base font-semibold uppercase tracking-[0.06em] sm:px-6 md:px-8">
          <span className="text-gris">Explorer l&apos;art togolais</span>
          <Link href="/art-togolais/peintres" className="underline-offset-4 hover:text-terracotta hover:underline">Peintres togolais</Link>
          <Link href="/art-togolais/sculpteurs" className="underline-offset-4 hover:text-terracotta hover:underline">Sculpteurs togolais</Link>
          <Link href="/art-togolais/plasticiens" className="underline-offset-4 hover:text-terracotta hover:underline">Plasticiens togolais</Link>
          <Link href="/actualites/agenda" className="underline-offset-4 hover:text-terracotta hover:underline">Agenda des expositions à Lomé</Link>
          <Link href="/art-togolais" className="underline-offset-4 hover:text-terracotta hover:underline">Guide de l&apos;art togolais</Link>
        </div>
      </section>

      {/* Motion design : comment utiliser la plateforme */}
      <section id="comment-ca-marche" className="scroll-mt-20 border-y border-fil bg-panel">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1fr] md:gap-16 md:px-8 md:py-24">
          <VideoExplication />
          <div>
            <p className="text-[12px] uppercase tracking-[0.22em] text-terracotta">Comment ça marche</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              De la découverte à votre mur, en quatre étapes.
            </h2>
            <ol className="mt-8 border-t border-encre/15">
              {ETAPES.map((etape, i) => (
                <li key={etape.titre} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-encre/15 py-5">
                  <span className="font-display text-2xl text-terracotta">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-2xl">{etape.titre}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-encre/75">{etape.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-craie">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <h2 className="font-display text-4xl md:text-5xl">Nos artistes</h2>
          {artistes.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {artistes.map((artiste) => (
                <ArtistCard key={artiste.id} artiste={artiste} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <ArtistesBientot />
            </div>
          )}
        </div>
      </section>

      <section
        id="mouvement"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1fr_2fr] md:gap-16 md:px-8 md:py-24"
      >
        <h2 className="font-display text-sm uppercase tracking-[0.22em]">
          À propos d’ArTova
        </h2>
        <div>
          <p className="max-w-2xl text-[15px] leading-7 text-encre/80">
            Nous croyons que l’art peut changer une vie et devenir un
            gagne-pain quotidien. ArTova révèle les peintres, plasticiens et
            sculpteurs du Togo : leurs histoires, leurs univers, leurs toiles
            et leurs sculptures.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-encre/80">
            Chaque artiste dispose d’une page qui lui ressemble : ses
            couleurs, ses matières et sa meilleure œuvre en grand format.
            Chaque commande transmise met directement l’artiste et le
            collectionneur en relation.
          </p>
          <Link
            href="/artistes"
            className="mt-8 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
          >
            Découvrir nos artistes ↗
          </Link>
        </div>
      </section>

      {!utilisateur && (
        <section className="bg-encre py-16 text-craie md:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-display text-3xl md:text-5xl">
              Rejoignez le mouvement.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-craie/70">
              Créez votre compte ArTova pour voir les prix et commander les
              œuvres qui vous parlent.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/inscription"
                className="bg-craie px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-panel"
              >
                Créer un compte ↗
              </Link>
              <Link
                href="/connexion"
                className="px-2 py-4 font-display text-lg underline underline-offset-4"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      )}

      {utilisateur?.role !== "artiste" && utilisateur?.role !== "admin" && (
        <section className="border-t border-fil bg-creme">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.4fr] md:gap-16 md:px-8 md:py-24">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta">
                Vous êtes artiste ?
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl md:text-5xl">
                Créez votre page,
                <br />
                à votre image.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-gris">
                Peintres, plasticiens et sculpteurs du Togo : présentez votre
                univers et vos œuvres aux collectionneurs, ArTova s&apos;occupe
                de la mise en relation et du suivi des commandes.
              </p>
              <Link
                href="/inscription?profil=artiste"
                className="mt-8 inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
              >
                Créer ma page d&apos;artiste ↗
              </Link>
            </div>
            <ol className="grid gap-px self-start border border-fil bg-fil sm:grid-cols-3">
              {[
                ["01", "Votre page", "Bannière, portrait, couleurs et votre histoire racontée comme vous le souhaitez."],
                ["02", "Vos œuvres", "Photos, prix, dimensions et techniques : vous gérez votre catalogue."],
                ["03", "Vos ventes", `Les collectionneurs commandent ; vous percevez ${PART_ARTISTE} % du prix, ArTova ${COMMISSION_ARTOVA} %.`],
              ].map(([numero, titre, texte]) => (
                <li key={numero} className="bg-craie p-6">
                  <span className="font-display text-sm text-terracotta">{numero}</span>
                  <h3 className="mt-2 font-display text-2xl">{titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gris">{texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}
