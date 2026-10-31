import Link from "next/link";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ArtworkCard, ArtistCard, ArtistesBientot } from "@/components/Cards";
import { ApercuArtistes } from "@/components/ApercuArtistes";
import { CONTACT } from "@/components/Header";
import { Monogramme, Wordmark } from "@/components/Logo";
import { COMMISSION_ARTOVA, type Artiste, type OeuvreAvecArtiste } from "@/lib/types";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Accueil() {
  const utilisateur = await getCurrentUser();
  const [oeuvres, artistes] = await Promise.all([
    query<OeuvreAvecArtiste>(
      `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent
       FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
       WHERE a.statut = 'publie'
       ORDER BY o.id DESC LIMIT 4`,
    ),
    query<Artiste>("SELECT * FROM artistes WHERE statut = 'publie' ORDER BY id"),
  ]);

  const site = process.env.SITE_URL || "https://artova-fin-production.up.railway.app";
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
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#site`,
        name: "ArTova",
        alternateName: "ArTova Togo",
        url: site,
        inLanguage: "fr",
        publisher: { "@id": `${site}/#organisation` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }}
      />
      <section className="relative h-[78svh] min-h-[520px] w-full overflow-hidden md:h-[72vh] md:min-h-[540px]">
        <img
          src="/images/hero.jpg"
          alt="Œuvres d'artistes togolais exposées par ArTova"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col md:inset-x-auto md:inset-y-0 md:right-0 md:w-full md:max-w-[440px] md:justify-center">
          <div className="bg-[#e4e2da]/95 px-6 py-7 sm:px-8 md:px-10 md:py-10">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-4xl md:text-5xl">
                L'art togolais,
                <br />
                maintenant.
              </h1>
              <span className="font-display text-sm text-gris">2026</span>
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-encre/70 md:mt-8 md:text-[12px]">
              Révéler les peintres, plasticiens et sculpteurs du Togo
            </p>
          </div>
          <div className="bg-craie px-6 py-5 sm:px-8 md:ml-10 md:px-10 md:py-8">
            {utilisateur ? (
              <Link
                href="/artistes"
                className="font-display text-lg underline-offset-4 hover:underline"
              >
                Découvrir les artistes ↗
              </Link>
            ) : (
              <Link
                href="#apercu"
                className="font-display text-lg underline-offset-4 hover:underline"
              >
                Aperçu de nos artistes ↗
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="bg-craie py-20 md:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
          <Monogramme className="h-28 w-auto md:h-40" />
          <Wordmark className="mt-6 h-10 w-auto md:h-14" />
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-gris">
            La plateforme du mouvement ArTova : chaque toile, chaque sculpture
            raconte le Togo qui crée.
          </p>
        </div>
      </section>

      <section
        id="mouvement"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1fr_2fr] md:gap-16 md:px-8 md:py-24"
      >
        <h2 className="font-display text-sm uppercase tracking-[0.22em]">
          À propos d'ArTova
        </h2>
        <div>
          <p className="max-w-2xl text-[15px] leading-7 text-encre/80">
            Nous croyons que l'art peut changer une vie et devenir un
            gagne-pain quotidien. ArTova révèle les peintres, plasticiens et
            sculpteurs du Togo : leurs histoires, leurs univers, leurs toiles
            et leurs sculptures.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-encre/80">
            Chaque artiste dispose d'une page qui lui ressemble : ses
            couleurs, ses matières et sa meilleure œuvre en grand format.
            Chaque commande transmise met directement l'artiste et le
            collectionneur en relation.
          </p>
          {utilisateur ? (
            <Link
              href="/artistes"
              className="mt-8 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
            >
              Découvrir nos artistes ↗
            </Link>
          ) : (
            <Link
              href="/inscription"
              className="mt-8 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
            >
              Rejoindre le mouvement ↗
            </Link>
          )}
        </div>
      </section>

      {utilisateur ? (
        <>
          {oeuvres.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">Dernières œuvres</h2>
              <Link
                href="/artistes"
                className="text-[12px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
              >
                Tout voir ↗
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {oeuvres.map((oeuvre) => (
                <ArtworkCard key={oeuvre.id} oeuvre={oeuvre} afficherArtiste />
              ))}
            </div>
          </section>
          )}

          <section className="border-t border-fil bg-craie">
            <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
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
        </>
      ) : (
        <>
        <ApercuArtistes />
        <section className="bg-encre py-16 text-craie md:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-display text-3xl md:text-5xl">
              Rejoignez le mouvement.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-craie/70">
              Créez un compte ArTova pour découvrir les univers de nos artistes,
              leurs histoires et leurs œuvres, puis commander celles qui vous
              parlent.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/inscription?next=/artistes"
                className="bg-craie px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-panel"
              >
                Créer un compte ↗
              </Link>
              <Link
                href="/connexion?next=/artistes"
                className="px-2 py-4 font-display text-lg underline underline-offset-4"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
        </>
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
                ["03", "Vos ventes", `Les collectionneurs commandent ; vous percevez ${100 - COMMISSION_ARTOVA} % du prix, ArTova ${COMMISSION_ARTOVA} %.`],
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
