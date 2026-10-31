import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { peutVoirArtiste } from "@/lib/artistes";
import { ArtworkCard } from "@/components/Cards";
import { BoutonPartager } from "@/components/BoutonPartager";
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
  if (!peutVoirArtiste(artiste, await getCurrentUser())) notFound();

  const oeuvres = await query<Oeuvre>(
    "SELECT * FROM oeuvres WHERE artiste_id = ? ORDER BY oeuvre_maitre DESC, id",
    [artiste.id],
  );
  const maitresse = oeuvres.find((o) => o.oeuvre_maitre === 1) ?? oeuvres[0];
  const discipline = LIBELLE_DISCIPLINE[artiste.discipline];
  const paragraphes = artiste.histoire
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const expositions = (artiste.expositions ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const parcours = [
    artiste.annee_debut && {
      label: "Artiste depuis",
      valeur: `${artiste.annee_debut} · ${new Date().getFullYear() - artiste.annee_debut} ans de pratique`,
    },
    artiste.techniques && { label: "Techniques", valeur: artiste.techniques },
    artiste.formation && { label: "Formation", valeur: artiste.formation },
  ].filter(Boolean) as { label: string; valeur: string }[];

  return (
    <>
      {artiste.statut !== "publie" && (
        <div className="border-b border-[#d9a441]/50 bg-[#f7ecd2] px-4 py-3 text-center text-[11px] uppercase tracking-[0.16em] text-encre">
          Aperçu : cette page n&apos;est pas encore publiée
          {artiste.statut === "en_attente" ? " (en attente de validation)" : ""}
        </div>
      )}
      <section
        className="relative w-full overflow-hidden md:min-h-[76vh]"
        style={{ backgroundColor: artiste.theme_primaire }}
      >
        {artiste.banniere_url ? (
          <img
            src={artiste.banniere_url}
            alt={`Bannière de ${artiste.nom}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          maitresse && (
            <img
              src={maitresse.image_url}
              alt={`${maitresse.titre}, œuvre maîtresse de ${artiste.nom}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        )}
        <Motif
          type={artiste.motif}
          couleur={artiste.theme_accent}
          className="pointer-events-none absolute -left-16 top-10 h-40 w-40 opacity-20 md:h-64 md:w-64"
        />
        <div className="relative flex min-h-[64svh] flex-col justify-end pt-24 md:min-h-[76vh] md:items-end md:justify-center md:pt-0">
          <div
            className="w-full px-5 py-8 sm:px-6 sm:py-10 md:max-w-[470px] md:px-10"
            style={{ backgroundColor: artiste.theme_fond }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ color: artiste.theme_primaire }}
            >
              {discipline} · {artiste.ville ?? "Togo"}
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">{artiste.nom}</h1>
            {artiste.note_univers && (
              <p
                className="mt-4 font-display text-lg italic leading-snug"
                style={{ color: artiste.theme_primaire }}
              >
                {artiste.note_univers}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href="#oeuvres"
                className="font-display text-lg underline underline-offset-4 hover:no-underline"
              >
                Voir ses œuvres ↗
              </a>
              <BoutonPartager
                titre={`${artiste.nom} sur ArTova`}
                texte={`Découvrez l'univers de ${artiste.nom}, ${discipline.toLowerCase()} togolais, sur ArTova`}
              />
            </div>
          </div>
        </div>
        {maitresse && (
          <div className="relative bg-craie/95 px-5 py-4 md:absolute md:bottom-8 md:left-8 md:max-w-[340px]">
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
          <div>
            {artiste.portrait_url && (
              <img
                src={artiste.portrait_url}
                alt={artiste.nom}
                className="aspect-[3/4] w-full max-w-[280px] object-cover sm:max-w-sm md:sticky md:top-24"
              />
            )}
          </div>
          <div>
            <h2
              className="font-display text-sm uppercase tracking-[0.22em]"
              style={{ color: artiste.theme_primaire }}
            >
              Son histoire
            </h2>
            <div className="mt-6 max-w-2xl space-y-5 text-[15px] leading-7 text-encre/80">
              {paragraphes.map((paragraphe, i) => (
                <p
                  key={i}
                  className={i === 0 ? "font-display text-xl leading-8 text-encre md:text-2xl md:leading-9" : ""}
                >
                  {paragraphe}
                </p>
              ))}
            </div>

            {(parcours.length > 0 || expositions.length > 0) && (
              <div className="mt-12 max-w-2xl">
                <h2
                  className="font-display text-sm uppercase tracking-[0.22em]"
                  style={{ color: artiste.theme_primaire }}
                >
                  Parcours
                </h2>
                {parcours.length > 0 && (
                  <dl className="mt-6 border-b border-encre/15">
                    {parcours.map((ligne) => (
                      <div
                        key={ligne.label}
                        className="grid gap-1 border-t border-encre/15 py-4 sm:grid-cols-[160px_1fr] sm:gap-4"
                      >
                        <dt className="text-[11px] uppercase tracking-[0.18em] text-gris">{ligne.label}</dt>
                        <dd className="text-sm">{ligne.valeur}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {expositions.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gris">
                      Expositions & distinctions
                    </p>
                    <ul className="mt-4 space-y-3">
                      {expositions.map((exposition, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-6">
                          <span
                            className="mt-2.5 h-px w-4 shrink-0"
                            style={{ backgroundColor: artiste.theme_accent }}
                            aria-hidden="true"
                          />
                          {exposition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="oeuvres" className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">Ses œuvres</h2>
          <span className="text-sm text-gris">
            {oeuvres.length} œuvre{oeuvres.length > 1 ? "s" : ""}
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

      <section className="px-0 pb-16 sm:px-4 md:px-8 md:pb-24">
        <div
          className="mx-auto max-w-5xl px-6 py-14 text-center md:py-16"
          style={{ backgroundColor: artiste.theme_primaire }}
        >
          <h2 className="font-display text-2xl text-craie sm:text-3xl md:text-4xl">
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
