import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { ArtworkCard } from "@/components/Cards";
import { MotifPinceau, MotifCollage, MotifPierre } from "@/components/Motifs";
import { formatFcfa } from "@/lib/format";
import { LIBELLE_DISCIPLINE, type Artiste, type Oeuvre, type OeuvreAvecArtiste } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await query<Artiste>(
    "SELECT * FROM artistes WHERE slug = ? LIMIT 1",
    [slug],
  );
  return { title: rows[0]?.nom ?? "Artiste" };
}

function Motif({
  type,
  className,
  couleur,
}: {
  type: Artiste["motif"];
  className?: string;
  couleur: string;
}) {
  if (type === "pinceau") return <MotifPinceau className={className} couleur={couleur} />;
  if (type === "collage") return <MotifCollage className={className} couleur={couleur} />;
  return <MotifPierre className={className} couleur={couleur} />;
}

export default async function PageUnivers({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artistes = await query<Artiste>(
    "SELECT * FROM artistes WHERE slug = ? LIMIT 1",
    [slug],
  );
  const artiste = artistes[0];
  if (!artiste) notFound();

  const oeuvres = await query<Oeuvre>(
    "SELECT * FROM oeuvres WHERE artiste_id = ? ORDER BY oeuvre_maitre DESC, id",
    [artiste.id],
  );
  const maitresse = oeuvres.find((o) => o.oeuvre_maitre === 1) ?? oeuvres[0];
  const discipline = LIBELLE_DISCIPLINE[artiste.discipline];

  return (
    <>
      <section className="relative min-h-[76vh] w-full overflow-hidden">
        {maitresse && (
          <img
            src={maitresse.image_url}
            alt={`${maitresse.titre} — œuvre maîtresse de ${artiste.nom}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <Motif
          type={artiste.motif}
          couleur={artiste.theme_accent}
          className="pointer-events-none absolute -left-16 top-10 h-64 w-64 opacity-20"
        />
        <div className="relative flex min-h-[76vh] flex-col justify-center md:items-end">
          <div
            className="w-full px-6 py-10 md:max-w-[470px] md:px-10"
            style={{ backgroundColor: artiste.theme_fond }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ color: artiste.theme_primaire }}
            >
              {discipline} · {artiste.ville ?? "Togo"}
            </p>
            <h1 className="mt-4 font-display text-5xl md:text-6xl">{artiste.nom}</h1>
            {artiste.note_univers && (
              <p
                className="mt-4 font-display text-lg italic leading-snug"
                style={{ color: artiste.theme_primaire }}
              >
                {artiste.note_univers}
              </p>
            )}
            <a
              href="#oeuvres"
              className="mt-8 inline-block font-display text-lg underline underline-offset-4 hover:no-underline"
            >
              Voir ses œuvres ↗
            </a>
          </div>
        </div>
        {maitresse && (
          <div className="absolute bottom-4 left-4 max-w-[340px] bg-craie/95 px-5 py-4 md:bottom-8 md:left-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gris">
              Œuvre maîtresse
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <span className="font-display text-xl">{maitresse.titre}</span>
              <span
                className="shrink-0 text-[12px] uppercase tracking-[0.14em]"
                style={{ color: artiste.theme_primaire }}
              >
                {formatFcfa(maitresse.prix_fcfa)}
              </span>
            </div>
          </div>
        )}
      </section>

      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: artiste.theme_fond }}
      >
        <Motif
          type={artiste.motif}
          couleur={artiste.theme_accent}
          className="pointer-events-none absolute -bottom-16 -right-20 h-72 w-72 opacity-15"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[2fr_3fr] md:gap-16 md:px-8 md:py-24">
          <img
            src={artiste.portrait_url}
            alt={artiste.nom}
            className="aspect-[3/4] w-full max-w-sm object-cover"
          />
          <div>
            <h2
              className="font-display text-sm uppercase tracking-[0.22em]"
              style={{ color: artiste.theme_primaire }}
            >
              Son histoire
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-encre/80">
              {artiste.histoire}
            </p>
          </div>
        </div>
      </section>

      <section id="oeuvres" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl md:text-5xl">Ses œuvres</h2>
          <span className="text-sm text-gris">
            {oeuvres.length} œuvres · toiles et sculptures
          </span>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
          {oeuvres.map((oeuvre) => (
            <ArtworkCard
              key={oeuvre.id}
              oeuvre={{
                ...oeuvre,
                artiste_nom: artiste.nom,
                artiste_slug: artiste.slug,
                theme_primaire: artiste.theme_primaire,
                theme_accent: artiste.theme_accent,
              }}
            />
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div
          className="mx-auto max-w-5xl px-6 py-14 text-center md:py-16"
          style={{ backgroundColor: artiste.theme_primaire }}
        >
          <h2 className="font-display text-3xl text-craie md:text-4xl">
            Une œuvre de {artiste.nom} vous parle ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-craie/80">
            Choisissez l'œuvre qui vous ressemble : votre commande est
            transmise par email à l'équipe ArTova, puis l'artiste et vous êtes
            mis en relation pour la livraison et le règlement.
          </p>
          <a
            href="#oeuvres"
            className="mt-8 inline-block bg-craie px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-encre transition-colors hover:bg-panel"
          >
            Choisir une œuvre ↗
          </a>
        </div>
      </section>
    </>
  );
}
