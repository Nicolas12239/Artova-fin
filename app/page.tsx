import Link from "next/link";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ArtworkCard, ArtistCard } from "@/components/Cards";
import { Monogramme, Wordmark } from "@/components/Logo";
import type { Artiste, OeuvreAvecArtiste } from "@/lib/types";

export const metadata = {
  title: "Accueil",
};

export default async function Accueil() {
  const utilisateur = await getCurrentUser();
  const [oeuvres, artistes] = await Promise.all([
    query<OeuvreAvecArtiste>(
      `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent
       FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
       ORDER BY o.id DESC LIMIT 4`,
    ),
    query<Artiste>("SELECT * FROM artistes ORDER BY id"),
  ]);

  return (
    <>
      <section className="relative h-[72vh] min-h-[540px] w-full overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Œuvres du mouvement ArTova"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col justify-center">
          <div className="bg-[#e4e2da]/95 px-8 py-10 md:px-10">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-4xl leading-[1.05] md:text-5xl">
                L'art togolais,
                <br />
                maintenant.
              </h1>
              <span className="font-display text-sm text-gris">2026</span>
            </div>
            <p className="mt-8 text-[12px] uppercase tracking-[0.2em] text-encre/70">
              Révéler les peintres, plasticiens et sculpteurs du Togo
            </p>
          </div>
          <div className="ml-10 bg-craie px-8 py-8 md:px-10">
            {utilisateur ? (
              <Link
                href="/artistes"
                className="font-display text-lg underline-offset-4 hover:underline"
              >
                Découvrir les artistes ↗
              </Link>
            ) : (
              <Link
                href="/connexion?next=/artistes"
                className="font-display text-lg underline-offset-4 hover:underline"
              >
                Se connecter pour découvrir ↗
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
            Chaque artiste ouvre une page qui lui ressemble — couleurs,
            matières et meilleure œuvre en grand plan — et chaque commande
            transmise met directement l'artiste et le collectionneur en
            relation.
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
          <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl md:text-5xl">Dernières œuvres</h2>
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

          <section className="border-t border-fil bg-craie">
            <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
              <h2 className="font-display text-4xl md:text-5xl">Nos artistes</h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {artistes.map((artiste) => (
                  <ArtistCard key={artiste.id} artiste={artiste} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
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
    </>
  );
}
