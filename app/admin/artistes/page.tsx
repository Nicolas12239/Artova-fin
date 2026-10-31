import Link from "next/link";
import { FormAdminArtiste, type ArtisteInitial } from "@/components/FormAdmin";
import { query } from "@/lib/db";
import { changerStatutArtiste } from "@/app/actions/admin";
import { SupprimerArtiste } from "@/components/SupprimerArtiste";
import { LIBELLE_DISCIPLINE, LIBELLE_STATUT_ARTISTE, type Artiste } from "@/lib/types";

export const metadata = { title: "Artistes | Administration" };

export default async function PageAdminArtistes({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; suppression?: string; compte?: string; nom?: string }>;
}) {
  const params = await searchParams;
  const artistes = await query<Artiste & { nb_oeuvres: number }>(
    `SELECT a.*, (SELECT COUNT(*) FROM oeuvres o WHERE o.artiste_id = a.id) AS nb_oeuvres
     FROM artistes a ORDER BY FIELD(a.statut, 'en_attente', 'publie', 'brouillon'), a.nom`,
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
        {params.suppression === "ok" && (
          <p role="status" className="mt-4 border-l-2 border-[#3f7d4e] pl-3 text-sm">
            {params.nom} a été supprimé·e avec ses œuvres
            {params.compte === "supprime"
              ? " et son compte."
              : params.compte === "conserve"
                ? ". Son compte est conservé en collectionneur, car il contient des achats."
                : "."}
          </p>
        )}
        {params.suppression === "commandes" && (
          <p role="alert" className="mt-4 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            Impossible de supprimer {params.nom} : des commandes portent sur ses œuvres.
            Dépubliez plutôt sa page pour la retirer du site.
          </p>
        )}
        <ul className="mt-6 space-y-3">
          {artistes.map((artiste) => (
            <li
              key={artiste.id}
              className={`flex flex-wrap items-center justify-between gap-4 border bg-craie p-4 ${artiste.statut === "en_attente" ? "border-terracotta/50" : "border-encre/10"}`}
            >
              <div className="flex min-w-0 items-center gap-4">
                {artiste.portrait_url ? (
                  <img
                    src={artiste.portrait_url}
                    alt=""
                    className="h-14 w-12 shrink-0 object-cover"
                  />
                ) : (
                  <span className="h-14 w-12 shrink-0 bg-panel" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">
                    {artiste.nom}
                    {artiste.statut !== "publie" && (
                      <span
                        className={`ml-2 align-middle text-[10px] uppercase tracking-[0.15em] ${artiste.statut === "en_attente" ? "text-terracotta" : "text-encre/50"}`}
                      >
                        {LIBELLE_STATUT_ARTISTE[artiste.statut]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-encre/60">
                    {LIBELLE_DISCIPLINE[artiste.discipline]}
                    {artiste.ville ? ` · ${artiste.ville}` : ""} ·{" "}
                    {artiste.nb_oeuvres} œuvre{artiste.nb_oeuvres > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                {artiste.statut !== "publie" ? (
                  <form action={changerStatutArtiste.bind(null, artiste.id, "publie")}>
                    <button
                      type="submit"
                      className="bg-encre px-3 py-1 text-xs tracking-wide text-creme hover:bg-terracotta"
                    >
                      Publier
                    </button>
                  </form>
                ) : (
                  artiste.utilisateur_id && (
                    <form action={changerStatutArtiste.bind(null, artiste.id, "brouillon")}>
                      <button
                        type="submit"
                        className="text-xs tracking-wide text-encre/60 underline-offset-4 hover:text-terracotta hover:underline"
                      >
                        Dépublier
                      </button>
                    </form>
                  )
                )}
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
                <SupprimerArtiste id={artiste.id} nom={artiste.nom} />
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
