import Link from "next/link";
import { query } from "@/lib/db";
import { formatDateHeureFr, formatFcfa } from "@/lib/format";
import { LIBELLE_STATUT_COMMANDE, type CommandeDetaillee } from "@/lib/types";

export const metadata = { title: "Administration" };

export default async function PageAdmin() {
  const [comptes, commandes, oeuvreStats, nbCommandes] = await Promise.all([
    query<{ nb_clients: number }>(
      "SELECT COUNT(*) AS nb_clients FROM utilisateurs WHERE role = 'client'",
    ),
    query<CommandeDetaillee & { nb: number }>(
      `SELECT c.*, u.nom AS client_nom, u.email AS client_email,
              o.titre AS oeuvre_titre, o.image_url AS oeuvre_image, o.prix_fcfa, a.nom AS artiste_nom
       FROM commandes c
       JOIN utilisateurs u ON u.id = c.utilisateur_id
       JOIN oeuvres o ON o.id = c.oeuvre_id
       JOIN artistes a ON a.id = o.artiste_id
       ORDER BY c.cree_le DESC LIMIT 6`,
    ),
    query<{ total: number; disponibles: number; reservees: number; vendues: number }>(
      `SELECT COUNT(*) AS total,
              SUM(statut = 'disponible') AS disponibles,
              SUM(statut = 'reserve') AS reservees,
              SUM(statut = 'vendu') AS vendues
       FROM oeuvres`,
    ),
    query<{ nb: number }>("SELECT COUNT(*) AS nb FROM commandes"),
  ]);

  const statsOeuvres = oeuvreStats[0];

  const cartes: { label: string; valeur: string; lien?: string }[] = [
    { label: "Clients inscrits", valeur: String(comptes[0]?.nb_clients ?? 0) },
    { label: "Commandes", valeur: String(nbCommandes[0]?.nb ?? 0), lien: "/admin/commandes" },
    { label: "Œuvres disponibles", valeur: String(statsOeuvres?.disponibles ?? 0), lien: "/admin/oeuvres" },
    { label: "Œuvres vendues", valeur: String(statsOeuvres?.vendues ?? 0) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartes.map((carte) => (
          <div key={carte.label} className="border border-encre/10 bg-craie p-5">
            <p className="text-xs tracking-wide text-encre/60">{carte.label}</p>
            {carte.lien ? (
              <Link
                href={carte.lien}
                className="mt-2 block font-display text-3xl hover:text-terracotta"
              >
                {carte.valeur}
              </Link>
            ) : (
              <p className="mt-2 font-display text-3xl">{carte.valeur}</p>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl">Dernières commandes</h2>
      {commandes.length === 0 ? (
        <p className="mt-4 text-sm text-encre/60">Aucune commande pour le moment.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {commandes.map((commande) => (
            <li
              key={commande.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-encre/10 bg-craie p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {commande.reference} · {commande.oeuvre_titre}
                </p>
                <p className="text-xs text-encre/60">
                  {commande.client_nom} ({commande.client_email}) ·{" "}
                  {formatDateHeureFr(commande.cree_le)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">{formatFcfa(commande.prix_fcfa)}</span>
                <span className="border border-encre/20 px-2 py-1 text-xs tracking-wide">
                  {LIBELLE_STATUT_COMMANDE[commande.statut]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6">
        <Link
          href="/admin/commandes"
          className="text-sm tracking-wide text-encre/70 underline-offset-4 hover:text-terracotta hover:underline"
        >
          Gérer toutes les commandes →
        </Link>
      </p>
    </>
  );
}
