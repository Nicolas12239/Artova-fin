import Link from "next/link";
import { formatFcfa } from "@/lib/format";
import { LIBELLE_DISCIPLINE, type Discipline, type OeuvreAvecArtiste } from "@/lib/types";

export function ArtworkCard({
  oeuvre,
  afficherArtiste,
}: {
  oeuvre: OeuvreAvecArtiste;
  afficherArtiste?: boolean;
}) {
  return (
    <Link href={`/oeuvres/${oeuvre.id}`} className="group block">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-panel p-6 md:p-8">
        <img
          src={oeuvre.image_url}
          alt={oeuvre.titre}
          className="max-h-full w-auto max-w-full object-contain shadow-[0_12px_32px_rgba(27,26,23,0.16)] transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {oeuvre.statut !== "disponible" && (
          <span className="absolute left-3 top-3 border border-fil bg-craie px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-gris">
            {oeuvre.statut === "reserve" ? "Réservée" : "Vendue"}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-encre/90 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-craie transition-transform duration-300 group-hover:translate-y-0">
          Voir l'œuvre
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[12px] uppercase tracking-[0.16em]">{oeuvre.titre}</h3>
        <span className="shrink-0 text-sm text-gris">{formatFcfa(oeuvre.prix_fcfa)}</span>
      </div>
      {afficherArtiste && (
        <p className="mt-1 text-xs text-gris">
          {oeuvre.artiste_nom} · {oeuvre.type}
        </p>
      )}
    </Link>
  );
}

export function ArtistCard({
  artiste,
}: {
  artiste: {
    slug: string;
    nom: string;
    discipline: string;
    ville: string | null;
    portrait_url: string;
  };
}) {
  const discipline =
    LIBELLE_DISCIPLINE[artiste.discipline as Discipline] ?? artiste.discipline;
  return (
    <Link href={`/artistes/${artiste.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-panel">
        <img
          src={artiste.portrait_url}
          alt={artiste.nom}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-encre/90 py-3 text-center text-[11px] uppercase tracking-[0.18em] text-craie transition-transform duration-300 group-hover:translate-y-0">
          Voir l'univers
        </span>
      </div>
      <h3 className="mt-4 text-[13px] uppercase tracking-[0.18em]">{artiste.nom}</h3>
      <p className="mt-1 text-sm text-gris">
        {discipline}
        {artiste.ville ? ` · ${artiste.ville}` : ""}
      </p>
    </Link>
  );
}

// Affiché tant qu'aucun artiste n'est publié (ou aucun dans un filtre).
export function ArtistesBientot({ precision }: { precision?: string }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-encre/25 px-6 py-16 text-center md:py-20">
      <img src="/logo/ArTova_monogramme_AT_bicolore.svg" alt="" className="h-12 w-auto opacity-80" />
      <p className="mt-6 font-display text-3xl md:text-4xl">
        {precision ?? "Les premiers artistes arrivent"}
      </p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-gris">
        Les pages des peintres, plasticiens et sculpteurs ArTova sont en cours de
        validation par notre équipe. Revenez très vite découvrir leurs univers.
      </p>
      <Link
        href="/inscription?profil=artiste"
        className="mt-8 inline-block bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
      >
        Vous êtes artiste ? Créez votre page ↗
      </Link>
    </div>
  );
}
