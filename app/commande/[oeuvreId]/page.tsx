import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FormCommande } from "@/components/FormCommande";
import { formatFcfa } from "@/lib/format";
import type { OeuvreAvecArtiste } from "@/lib/types";

export const metadata = {
  title: "Votre commande",
  robots: { index: false, follow: false },
};

export default async function PageCommande({
  params,
}: {
  params: Promise<{ oeuvreId: string }>;
}) {
  const { oeuvreId } = await params;
  const id = Number(oeuvreId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const utilisateur = await getCurrentUser();
  if (!utilisateur) redirect(`/connexion?next=/commande/${id}`);

  const oeuvres = await query<OeuvreAvecArtiste>(
    `SELECT o.*, a.nom AS artiste_nom, a.slug AS artiste_slug, a.theme_primaire, a.theme_accent
     FROM oeuvres o JOIN artistes a ON a.id = o.artiste_id
     WHERE o.id = ? AND a.statut = 'publie' LIMIT 1`,
    [id],
  );
  const oeuvre = oeuvres[0];
  if (!oeuvre) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gris">Commande</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Votre commande</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gris">
        Vérifiez l'œuvre puis confirmez : votre commande est transmise par
        email à l'équipe ArTova avec vos coordonnées de compte ({utilisateur.nom},{" "}
        {utilisateur.email}). Nous vous recontactons pour la livraison et le
        règlement.
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
        <div>
          <div className="bg-panel p-6">
            <img
              src={oeuvre.image_url}
              alt={oeuvre.titre}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.16em]">{oeuvre.titre}</p>
              <p className="mt-1 text-sm text-gris">
                {oeuvre.artiste_nom} · {oeuvre.type}
              </p>
            </div>
            <p className="shrink-0 font-display text-2xl">{formatFcfa(oeuvre.prix_fcfa)}</p>
          </div>
        </div>

        <div>
          {oeuvre.statut !== "disponible" ? (
            <p className="border border-fil bg-panel px-6 py-5 text-sm text-gris">
              Cette œuvre n'est plus disponible à la commande.
            </p>
          ) : (
            <FormCommande oeuvreId={oeuvre.id} telephoneInitial={utilisateur.telephone} />
          )}
          <p className="mt-8">
            <Link
              href={`/oeuvres/${oeuvre.id}`}
              className="font-display underline underline-offset-4 hover:no-underline"
            >
              ← Revoir l'œuvre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
