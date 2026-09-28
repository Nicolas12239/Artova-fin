import Link from "next/link";
import { FormAdminArtiste, type ArtisteInitial } from "@/components/FormAdmin";
import { query } from "@/lib/db";
import { LIBELLE_DISCIPLINE, type Artiste } from "@/lib/types";

export const metadata = { title: "Artistes — Administration" };

export default async function PageAdminArtistes({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const artistes = await query<Artiste & { nb_oeuvres: number }>(
    `SELECT a.*, (SELECT COUNT(*) FROM oeuvres o WHERE o.artiste_id = a.id) AS nb_oeuvres
     FROM artistes a ORDER BY a.nom`,
  );

  let initial: ArtisteInitial | undefined;
  if (params.edit) {
    const cible = artistes.find((a) => String(a.id) === params.edit);
    if (cible) {
      initial = {
        id: cible.id,
        nom: cible.nom,
        discipline: cible.discipline,
        ville: cible.ville,
        histoire: cible.histoire,
        note_univers: cible.note_univers,
        theme_primaire: cible.theme_primaire,
        theme_accent: cible.theme_accent,
        theme_fond: cible.theme_fond,
        motif: cible.motif,
      };
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <section>
        <h2 className="font-display text-2xl md:text-3xl">Les artistes</h2>
        <ul className="mt-6 space-y-3">
          {artistes.map((artiste) => (
            <li
              key={artiste.id}
              className="flex items-center justify-between gap-4 border border-encre/10 bg-craie p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={artiste.portrait_url}
                  alt=""
                  className="h-14 w-12 shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">{artiste.nom}</p>
                  <p className="text-xs text-encre/60">
                    {LIBELLE_DISCIPLINE[artiste.discipline]}
                    {artiste.ville ? ` · ${artiste.ville}` : ""} ·{" "}
                    {artiste.nb_oeuvres} œuvre{artiste.nb_oeuvres > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/artistes/${artiste.slug}`}
                  className="text-xs tracking-wide text-encre/60 underline-offset-4 hover:underline"
                >
                  Voir
                </Link>
                <Link
                  href={`/admin/artistes?edit=${artiste.id}`}
                  className="border border-encre/25 px-3 py-1 text-xs tracking-wide hover:border-terracotta hover:text-terracotta"
                >
                  Modifier
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-encre/10 bg-craie p-6 md:p-8">
        <h2 className="font-display text-2xl">
          {initial ? `Modifier ${initial.nom}` : "Ajouter un artiste"}
        </h2>
        <p className="mt-2 text-xs text-encre/60">
          Les couleurs définissent l'univers de sa page : couleur principale,
          accent et fond.
        </p>
        <div className="mt-6">
          <FormAdminArtiste initial={initial} />
        </div>
      </section>
    </div>
  );
}
