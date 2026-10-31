import Image from "next/image";
import Link from "next/link";
import { query } from "@/lib/db";
import { LIBELLE_DISCIPLINE, type Artiste, type Oeuvre } from "@/lib/types";
import { ArtistesBientot } from "./Cards";

// Nombre d'artistes montrés aux visiteurs non connectés : volontairement une
// minorité du catalogue, le reste est réservé aux membres.
const NB_ARTISTES_APERCU = 2;
const NB_OEUVRES_PAR_ARTISTE = 3;

function IconeCadenas({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="10.5" width="14" height="10" rx="1" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function OeuvreFloutee({ oeuvre, next }: { oeuvre: Oeuvre; next: string }) {
  return (
    <Link
      href={`/connexion?next=${encodeURIComponent(next)}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-panel"
      aria-label="Œuvre réservée aux membres : connectez-vous pour la découvrir"
    >
      {/* Miniature de 32 px servie par l'optimiseur : l'image en pleine
          résolution n'est jamais envoyée aux visiteurs non connectés. */}
      <Image
        src={oeuvre.image_url}
        alt=""
        width={32}
        height={40}
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-xl"
      />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-encre/10 p-2 text-center text-craie transition-colors group-hover:bg-encre/35">
        <IconeCadenas className="h-6 w-6 drop-shadow" />
        <span className="hidden text-[10px] uppercase tracking-[0.16em] drop-shadow sm:block">
          Réservée aux membres
        </span>
      </span>
    </Link>
  );
}

export async function ApercuArtistes() {
  const artistes = await query<Artiste>(
    `SELECT * FROM artistes WHERE statut = 'publie' ORDER BY id LIMIT ${NB_ARTISTES_APERCU}`,
  );
  const [total] = await query<{ nb: number }>("SELECT COUNT(*) AS nb FROM artistes WHERE statut = 'publie'");
  const oeuvresParArtiste = await Promise.all(
    artistes.map((artiste) =>
      query<Oeuvre>(
        `SELECT * FROM oeuvres WHERE artiste_id = ? ORDER BY oeuvre_maitre DESC, id LIMIT ${NB_OEUVRES_PAR_ARTISTE}`,
        [artiste.id],
      ),
    ),
  );
  const autres = Math.max(0, Number(total?.nb ?? 0) - artistes.length);

  if (artistes.length === 0) {
    return (
      <section id="apercu" className="scroll-mt-20 border-t border-fil bg-craie">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
          <ArtistesBientot />
        </div>
      </section>
    );
  }

  return (
    <section id="apercu" className="scroll-mt-20 border-t border-fil bg-craie">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gris">Aperçu</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl md:text-5xl">Quelques-uns de nos artistes</h2>
          <p className="max-w-md text-sm leading-relaxed text-gris">
            Connectez-vous ou créez un compte pour voir leurs œuvres en clair,
            découvrir leurs détails et les commander.
          </p>
        </div>

        <div className="mt-12 space-y-14 md:space-y-16">
          {artistes.map((artiste, i) => {
            const next = `/artistes/${artiste.slug}`;
            return (
              <article
                key={artiste.id}
                className="grid gap-6 md:grid-cols-[240px_1fr] md:gap-10 lg:grid-cols-[280px_1fr]"
              >
                <div className="flex gap-4 md:block">
                  <img
                    src={artiste.portrait_url}
                    alt={artiste.nom}
                    className="aspect-[3/4] w-28 shrink-0 object-cover sm:w-36 md:w-full"
                  />
                  <div className="md:mt-5">
                    <p
                      className="text-[11px] uppercase tracking-[0.2em]"
                      style={{ color: artiste.theme_primaire }}
                    >
                      {LIBELLE_DISCIPLINE[artiste.discipline]} · {artiste.ville ?? "Togo"}
                    </p>
                    <h3 className="mt-2 font-display text-2xl sm:text-3xl">{artiste.nom}</h3>
                    {artiste.note_univers && (
                      <p className="mt-2 font-display text-base italic leading-snug text-encre/70">
                        {artiste.note_univers}
                      </p>
                    )}
                    <Link
                      href={`/connexion?next=${encodeURIComponent(next)}`}
                      className="mt-4 inline-block text-[12px] uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline"
                    >
                      Voir son univers ↗
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                  {oeuvresParArtiste[i].map((oeuvre) => (
                    <OeuvreFloutee key={oeuvre.id} oeuvre={oeuvre} next={next} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-start gap-6 border-t border-fil pt-10 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-display text-xl leading-snug md:text-2xl">
            {autres > 0
              ? `Et ${autres} autre${autres > 1 ? "s" : ""} artiste${autres > 1 ? "s" : ""} à découvrir avec votre compte ArTova.`
              : "Découvrez toutes leurs œuvres avec votre compte ArTova."}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/inscription?next=/artistes"
              className="bg-encre px-8 py-4 text-center text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
            >
              Créer un compte ↗
            </Link>
            <Link
              href="/connexion?next=/artistes"
              className="py-2 text-center font-display text-lg underline underline-offset-4 hover:no-underline"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
