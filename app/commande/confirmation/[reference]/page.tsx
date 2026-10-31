import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatFcfa, formatDateHeureFr } from "@/lib/format";
import {
  LIBELLE_STATUT_COMMANDE,
  type CommandeDetaillee,
} from "@/lib/types";

export const metadata = {
  title: "Commande transmise",
  robots: { index: false, follow: false },
};

export default async function PageConfirmation({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const utilisateur = await getCurrentUser();
  if (!utilisateur) redirect(`/connexion?next=/commande/confirmation/${reference}`);

  const commandes = await query<CommandeDetaillee>(
    `SELECT c.*, u.nom AS client_nom, u.email AS client_email,
            o.titre AS oeuvre_titre, o.image_url AS oeuvre_image, o.prix_fcfa,
            a.nom AS artiste_nom
     FROM commandes c
     JOIN utilisateurs u ON u.id = c.utilisateur_id
     JOIN oeuvres o ON o.id = c.oeuvre_id
     JOIN artistes a ON a.id = o.artiste_id
     WHERE c.reference = ? LIMIT 1`,
    [reference],
  );
  const commande = commandes[0];
  if (!commande) notFound();

  const prenom = commande.client_nom.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
      <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta">
        Commande transmise
      </p>
      <h1 className="mt-4 font-display text-5xl md:text-6xl">Merci, {prenom} !</h1>
      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gris">
        Votre commande <strong className="text-encre">{commande.reference}</strong>{" "}
        du {formatDateHeureFr(commande.cree_le)} a été enregistrée et transmise
        par email à l'équipe ArTova. Nous vous recontactons au{" "}
        {commande.telephone} pour la livraison et le règlement.
      </p>

      <div className="mt-10 border border-fil bg-craie p-6 text-left md:p-8">
        <div className="flex items-center gap-5">
          <img
            src={commande.oeuvre_image}
            alt={commande.oeuvre_titre}
            className="h-24 w-24 shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight">{commande.oeuvre_titre}</p>
            <p className="mt-1 text-sm text-gris">{commande.artiste_nom}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl">{formatFcfa(commande.prix_fcfa)}</p>
            <span className="mt-2 inline-block border border-fil px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gris">
              {LIBELLE_STATUT_COMMANDE[commande.statut]}
            </span>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-fil pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-gris">Ville</dt>
            <dd className="mt-1 text-sm">{commande.ville}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-gris">Téléphone</dt>
            <dd className="mt-1 text-sm">{commande.telephone}</dd>
          </div>
          {commande.adresse && (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-gris">Adresse</dt>
              <dd className="mt-1 text-sm">{commande.adresse}</dd>
            </div>
          )}
          {commande.message && (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-gris">Message</dt>
              <dd className="mt-1 text-sm">{commande.message}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/compte"
          className="bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta"
        >
          Suivre mes commandes ↗
        </Link>
        <Link
          href="/artistes"
          className="px-2 py-4 font-display text-lg underline underline-offset-4 hover:no-underline"
        >
          Continuer la découverte
        </Link>
      </div>
    </div>
  );
}
