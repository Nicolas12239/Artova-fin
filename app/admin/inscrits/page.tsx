import Link from "next/link";
import { query } from "@/lib/db";
import { formatDateHeureFr } from "@/lib/format";
import { filtreValide, listerInscrits, type FiltreInscrits } from "@/lib/inscrits";

export const metadata = { title: "Inscrits | Administration" };

const ONGLETS: { valeur: FiltreInscrits; label: string }[] = [
  { valeur: "tous", label: "Tous" },
  { valeur: "collectionneurs", label: "Collectionneurs" },
  { valeur: "artistes", label: "Artistes" },
];

export default async function PageInscrits({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const filtre = filtreValide((await searchParams).filtre);
  const [inscrits, compteurs] = await Promise.all([
    listerInscrits(filtre),
    query<{ statut: string; nb: number }>(
      "SELECT statut, COUNT(*) AS nb FROM inscrits GROUP BY statut",
    ),
  ]);
  const nb = (statut: string) => Number(compteurs.find((c) => c.statut === statut)?.nb ?? 0);
  const total = nb("Collectionneur") + nb("Artiste");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl">Inscrits</h2>
          <p className="mt-2 text-sm text-encre/60">
            {total} inscrit{total > 1 ? "s" : ""} : {nb("Collectionneur")} collectionneur
            {nb("Collectionneur") > 1 ? "s" : ""} et {nb("Artiste")} artiste
            {nb("Artiste") > 1 ? "s" : ""}.
          </p>
        </div>
        <a
          href={`/admin/inscrits/export?filtre=${filtre}`}
          className="border border-encre/25 px-4 py-2 text-xs tracking-wide hover:border-terracotta hover:text-terracotta"
        >
          Exporter (Excel / CSV)
        </a>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer les inscrits">
        {ONGLETS.map((o) => (
          <Link
            key={o.valeur}
            href={o.valeur === "tous" ? "/admin/inscrits" : `/admin/inscrits?filtre=${o.valeur}`}
            className={`border px-4 py-2 text-xs tracking-wide ${filtre === o.valeur ? "border-encre bg-encre text-creme" : "border-encre/20 hover:border-terracotta hover:text-terracotta"}`}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {inscrits.length === 0 ? (
        <p className="mt-8 border border-encre/10 bg-craie p-8 text-center text-sm text-encre/60">
          Aucun inscrit pour le moment.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-encre/20 text-left text-xs tracking-wide text-encre/60">
                <th className="py-3 pr-4 font-medium">Nom</th>
                <th className="py-3 pr-4 font-medium">Contact</th>
                <th className="py-3 pr-4 font-medium">Statut</th>
                <th className="py-3 pr-4 font-medium">Connexion</th>
                <th className="py-3 pr-4 font-medium">Commandes</th>
                <th className="py-3 font-medium">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {inscrits.map((i) => (
                <tr key={i.id} className="border-b border-encre/10 align-top">
                  <td className="py-3 pr-4">
                    <span className="font-semibold">{i.nom}</span>
                    {i.nom_artiste && i.nom_artiste !== i.nom && (
                      <span className="block text-xs text-encre/60">Artiste : {i.nom_artiste}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <a href={`mailto:${i.email}`} className="hover:underline">{i.email}</a>
                    {i.telephone && <span className="block text-xs text-encre/60">{i.telephone}</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block border px-2 py-0.5 text-xs ${i.statut === "Artiste" ? "border-terracotta/50 text-terracotta" : "border-encre/20"}`}
                    >
                      {i.statut}
                    </span>
                    {i.page_artiste && (
                      <span className="mt-1 block text-xs text-encre/60">Page : {i.page_artiste}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-encre/70">{i.methode_connexion}</td>
                  <td className="py-3 pr-4">{i.nb_commandes}</td>
                  <td className="whitespace-nowrap py-3 text-encre/70">{formatDateHeureFr(i.inscrit_le)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
