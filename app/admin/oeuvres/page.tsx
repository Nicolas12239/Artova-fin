import Link from "next/link";
import { FormAdminOeuvre, type OeuvreInitiale } from "@/components/FormAdmin";
import { query } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { LIBELLE_STATUT_OEUVRE, type Artiste, type Oeuvre } from "@/lib/types";

export const metadata = { title: "Œuvres — Administration" };

export default async function PageAdminOeuvres({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const [oeuvres, artistes] = await Promise.all([
    query<Oeuvre & { artiste_nom: string }>(
      `SELECT o.*, a.nom AS artiste_nom
       FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
       ORDER BY a.nom, o.oeuvre_maitre DESC, o.titre`,
    ),
    query<Artiste>("SELECT * FROM artistes ORDER BY nom"),
  ]);

  let initial: OeuvreInitiale | undefined;
  if (params.edit) {
    const cible = oeuvres.find((o) => String(o.id) === params.edit);
    if (cible) {
      initial = {
        id: cible.id,
        artiste_id: cible.artiste_id,
        titre: cible.titre,
        type: cible.type,
        prix_fcfa: cible.prix_fcfa,
        annee: cible.annee,
        dimensions: cible.dimensions,
        technique: cible.technique,
        description: cible.description,
        oeuvre_maitre: cible.oeuvre_maitre,
        statut: cible.statut,
      };
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <section>
        <h2 className="font-display text-2xl md:text-3xl">Les œuvres</h2>
        <ul className="mt-6 space-y-3">
          {oeuvres.map((oeuvre) => (
            <li
              key={oeuvre.id}
              className="flex items-center justify-between gap-4 border border-encre/10 bg-craie p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={oeuvre.image_url}
                  alt=""
                  className="h-14 w-12 shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">
                    {oeuvre.titre}
                    {oeuvre.oeuvre_maitre === 1 && (
                      <span className="ml-2 align-middle text-[10px] tracking-[0.15em] text-terracotta">
                        MAÎTRESSE
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-encre/60">
                    {oeuvre.artiste_nom} · {oeuvre.type} ·{" "}
                    {formatFcfa(oeuvre.prix_fcfa)} ·{" "}
                    {LIBELLE_STATUT_OEUVRE[oeuvre.statut]}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/oeuvres/${oeuvre.id}`}
                  className="text-xs tracking-wide text-encre/60 underline-offset-4 hover:underline"
                >
                  Voir
                </Link>
                <Link
                  href={`/admin/oeuvres?edit=${oeuvre.id}`}
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
          {initial ? `Modifier « ${initial.titre} »` : "Ajouter une œuvre"}
        </h2>
        <p className="mt-2 text-xs text-encre/60">
          ArTova n'expose que des toiles et des sculptures.
        </p>
        <div className="mt-6">
          <FormAdminOeuvre
            artistes={artistes.map((a) => ({ id: a.id, nom: a.nom }))}
            initial={initial}
          />
        </div>
      </section>
    </div>
  );
}
