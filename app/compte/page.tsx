import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatFcfa, formatDateHeureFr } from "@/lib/format";
import {
  LIBELLE_STATUT_COMMANDE,
  type CommandeDetaillee,
} from "@/lib/types";

export const metadata = {
  title: "Mon compte",
};

export default async function PageCompte() {
  const utilisateur = await getCurrentUser();
  if (!utilisateur) redirect("/connexion?next=/compte");

  const commandes = await query<CommandeDetaillee>(
    `SELECT c.*, u.nom AS client_nom, u.email AS client_email,
            o.titre AS oeuvre_titre, o.image_url AS oeuvre_image, o.prix_fcfa,
            a.nom AS artiste_nom
     FROM commandes c
     JOIN utilisateurs u ON u.id = c.utilisateur_id
     JOIN oeuvres o ON o.id = c.oeuvre_id
     JOIN artistes a ON a.id = o.artiste_id
     WHERE c.utilisateur_id = ?
     ORDER BY c.id DESC`,
    [utilisateur.id],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gris">Mon compte</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">{utilisateur.nom}</h1>
      <p className="mt-3 text-sm text-gris">
        {utilisateur.email}
        {utilisateur.telephone ? ` · ${utilisateur.telephone}` : ""}
      </p>

      <h2 className="mt-14 font-display text-3xl md:text-4xl">Mes commandes</h2>
      {commandes.length === 0 ? (
        <p className="mt-6 text-sm text-gris">
          Aucune commande pour le moment.{" "}
          <Link href="/artistes" className="text-encre underline underline-offset-4">
            Découvrir les œuvres ↗
          </Link>
        </p>
      ) : (
        <ul className="mt-8">
          {commandes.map((commande) => (
            <li
              key={commande.id}
              className="grid gap-4 border-t border-fil py-6 sm:grid-cols-[64px_1fr_auto] sm:items-center"
            >
              <img
                src={commande.oeuvre_image}
                alt={commande.oeuvre_titre}
                className="h-16 w-16 object-cover"
              />
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em]">
                  {commande.oeuvre_titre}
                </p>
                <p className="mt-1 text-sm text-gris">
                  {commande.artiste_nom} · {formatDateHeureFr(commande.cree_le)}
                </p>
                <p className="mt-1 text-xs text-gris">Réf. {commande.reference}</p>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <p className="font-display text-xl">{formatFcfa(commande.prix_fcfa)}</p>
                <span className="border border-fil px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gris">
                  {LIBELLE_STATUT_COMMANDE[commande.statut]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
