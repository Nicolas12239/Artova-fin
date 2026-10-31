import Link from "next/link";
import { query } from "@/lib/db";
import { ArtistCard, ArtistesBientot } from "@/components/Cards";
import type { Artiste } from "@/lib/types";

export const metadata = {
  title: "Nos artistes",
};

const FILTRES: { valeur: "" | Artiste["discipline"]; label: string }[] = [
  { valeur: "", label: "Tous les artistes" },
  { valeur: "peintre", label: "Peintres" },
  { valeur: "plasticien", label: "Plasticien·nes" },
  { valeur: "sculpteur", label: "Sculpteurs" },
];

export default async function PageArtistes({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>;
}) {
  const params = await searchParams;
  const discipline = params.discipline;
  const valide =
    discipline === "peintre" ||
    discipline === "plasticien" ||
    discipline === "sculpteur";

  const artistes = await query<Artiste>(
    valide
      ? "SELECT * FROM artistes WHERE statut = 'publie' AND discipline = ? ORDER BY id"
      : "SELECT * FROM artistes WHERE statut = 'publie' ORDER BY id",
    valide ? [discipline] : [],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gris">
        Découverte
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">Nos artistes</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-gris">
        Peintres, plasticiens et sculpteurs du Togo. Chaque artiste ouvre un
        univers qui lui ressemble : couleurs, matières et meilleure œuvre en
        grand plan.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <h2 className="font-display text-xl">Parcourir</h2>
          <ul className="mt-5 space-y-3 border-t border-fil pt-5">
            {FILTRES.map((filtre) => {
              const actif =
                filtre.valeur === "" ? !valide : valide && discipline === filtre.valeur;
              return (
                <li key={filtre.valeur || "tous"}>
                  <Link
                    href={filtre.valeur ? `/artistes?discipline=${filtre.valeur}` : "/artistes"}
                    className={`text-[12px] uppercase tracking-[0.16em] ${actif ? "text-encre underline underline-offset-4" : "text-gris hover:text-encre"}`}
                  >
                    {filtre.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div>
          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
            {FILTRES.map((filtre) => {
              const actif = filtre.valeur === "" ? !valide : valide && discipline === filtre.valeur;
              return (
                <Link
                  key={filtre.valeur || "tous"}
                  href={filtre.valeur ? `/artistes?discipline=${filtre.valeur}` : "/artistes"}
                  className={`shrink-0 border px-4 py-2 text-[11px] uppercase tracking-[0.14em] ${actif ? "border-encre bg-encre text-craie" : "border-fil text-gris"}`}
                >
                  {filtre.label}
                </Link>
              );
            })}
          </div>

          {artistes.length === 0 ? (
            <ArtistesBientot
              precision={valide ? "Aucun artiste dans cette catégorie pour le moment" : undefined}
            />
          ) : (
            <>
              <p className="text-sm text-gris">
                {artistes.length} artiste{artistes.length > 1 ? "s" : ""}
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {artistes.map((artiste) => (
                  <ArtistCard key={artiste.id} artiste={artiste} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
