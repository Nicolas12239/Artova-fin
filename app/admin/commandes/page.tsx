import { SelectStatutCommande } from "@/components/SelectStatutCommande";
import { query } from "@/lib/db";
import { formatDateHeureFr, formatFcfa } from "@/lib/format";
import type { CommandeDetaillee } from "@/lib/types";

export const metadata = { title: "Commandes — Administration" };

export default async function PageAdminCommandes() {
  const commandes = await query<CommandeDetaillee>(
    `SELECT c.*, u.nom AS client_nom, u.email AS client_email,
            o.titre AS oeuvre_titre, o.image_url AS oeuvre_image, o.prix_fcfa, a.nom AS artiste_nom
     FROM commandes c
     JOIN utilisateurs u ON u.id = c.utilisateur_id
     JOIN oeuvres o ON o.id = c.oeuvre_id
     JOIN artistes a ON a.id = o.artiste_id
     ORDER BY c.cree_le DESC`,
  );

  return (
    <>
      <h2 className="font-display text-2xl md:text-3xl">Toutes les commandes</h2>
      <p className="mt-2 text-sm text-encre/60">
        {commandes.length} commande{commandes.length > 1 ? "s" : ""} · le passage
        à « Livrée » marque l'œuvre vendue ; « Annulée » la remet disponible.
      </p>

      {commandes.length === 0 ? (
        <p className="mt-8 border border-encre/10 bg-craie p-8 text-center text-sm text-encre/60">
          Aucune commande pour le moment.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-encre/20 text-left text-xs tracking-wide text-encre/60">
                <th className="py-3 pr-4 font-medium">Référence</th>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Client</th>
                <th className="py-3 pr-4 font-medium">Œuvre</th>
                <th className="py-3 pr-4 font-medium">Prix</th>
                <th className="py-3 pr-4 font-medium">Contact</th>
                <th className="py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((commande) => (
                <tr key={commande.id} className="border-b border-encre/10 align-top">
                  <td className="py-3 pr-4 font-semibold">{commande.reference}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-encre/70">
                    {formatDateHeureFr(commande.cree_le)}
                  </td>
                  <td className="py-3 pr-4">
                    {commande.client_nom}
                    <span className="block text-xs text-encre/60">{commande.client_email}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {commande.oeuvre_titre}
                    <span className="block text-xs text-encre/60">{commande.artiste_nom}</span>
                    {commande.message && (
                      <span className="mt-1 block max-w-[220px] text-xs italic text-encre/60">
                        « {commande.message} »
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatFcfa(commande.prix_fcfa)}</td>
                  <td className="py-3 pr-4 text-encre/70">
                    {commande.telephone}
                    <span className="block text-xs">{commande.ville}</span>
                    {commande.adresse && (
                      <span className="block max-w-[180px] text-xs">{commande.adresse}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <SelectStatutCommande commandeId={commande.id} statut={commande.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
