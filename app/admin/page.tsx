import Link from "next/link";
import { query } from "@/lib/db";
import { envoyerAlertesTest, envoyerEmailTest } from "@/app/actions/admin";
import { formaterNumero, numeroWhatsapp } from "@/lib/whatsapp";
import { canalNtfy } from "@/lib/ntfy";
import { destinatairesArtova } from "@/lib/email";
import { formatDateHeureFr, formatFcfa } from "@/lib/format";
import { LIBELLE_STATUT_COMMANDE, type CommandeDetaillee } from "@/lib/types";

export const metadata = { title: "Administration" };

function Resultat({ valeur }: { valeur?: string }) {
  if (valeur === "ok") {
    return <p role="status" className="mt-3 border-l-2 border-[#3f7d4e] pl-3 text-sm">Test envoyé.</p>;
  }
  if (valeur === "erreur") {
    return (
      <p role="alert" className="mt-3 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
        Échec de l&apos;envoi (détail dans les journaux Vercel).
      </p>
    );
  }
  if (valeur === "non-configure") {
    return <p className="mt-3 border-l-2 border-encre/30 pl-3 text-sm text-encre/60">Non configuré, rien n&apos;a été envoyé.</p>;
  }
  return null;
}

export default async function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; push?: string; whatsapp?: string }>;
}) {
  const { email, push, whatsapp } = await searchParams;
  const ntfy = canalNtfy();
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
  const [enAttente] = await query<{ nb: number }>(
    "SELECT COUNT(*) AS nb FROM artistes WHERE statut = 'en_attente'",
  );
  const nbEnAttente = Number(enAttente?.nb ?? 0);

  const statsOeuvres = oeuvreStats[0];

  const cartes: { label: string; valeur: string; lien?: string }[] = [
    { label: "Clients inscrits", valeur: String(comptes[0]?.nb_clients ?? 0) },
    { label: "Commandes", valeur: String(nbCommandes[0]?.nb ?? 0), lien: "/admin/commandes" },
    { label: "Œuvres disponibles", valeur: String(statsOeuvres?.disponibles ?? 0), lien: "/admin/oeuvres" },
    { label: "Œuvres vendues", valeur: String(statsOeuvres?.vendues ?? 0) },
  ];

  return (
    <>
      {nbEnAttente > 0 && (
        <Link
          href="/admin/artistes"
          className="mb-6 flex items-center justify-between gap-4 border border-terracotta/50 bg-craie p-5 hover:border-terracotta"
        >
          <span className="text-sm">
            {nbEnAttente} page{nbEnAttente > 1 ? "s" : ""} d&apos;artiste en attente de validation
          </span>
          <span className="text-xs tracking-wide text-terracotta">Examiner →</span>
        </Link>
      )}
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

      <section className="mt-14 border border-encre/10 bg-craie p-6">
        <h2 className="font-display text-2xl">Emails de commande</h2>
        <p className="mt-2 text-sm text-encre/70">
          Les commandes et les nouvelles pages d&apos;artistes sont envoyées à{" "}
          <strong className="font-medium text-encre">{destinatairesArtova()}</strong>.
        </p>
        {email === "ok" && (
          <p role="status" className="mt-4 border-l-2 border-[#3f7d4e] pl-3 text-sm">
            Email de test envoyé : vérifiez la boîte de réception (et les spams).
          </p>
        )}
        {email === "non-configure" && (
          <p role="alert" className="mt-4 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            L&apos;envoi n&apos;est pas configuré : ajoutez la variable RESEND_API_KEY sur Railway.
          </p>
        )}
        {email === "erreur" && (
          <p role="alert" className="mt-4 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
            L&apos;envoi a échoué. Le détail de l&apos;erreur figure dans les logs Railway.
          </p>
        )}
        <form action={envoyerEmailTest} className="mt-5">
          <button
            type="submit"
            className="border border-encre/25 px-4 py-2 text-xs tracking-wide hover:border-terracotta hover:text-terracotta"
          >
            Envoyer un email de test
          </button>
        </form>
      </section>

      <section className="mt-6 border border-encre/10 bg-craie p-6">
        <h2 className="font-display text-2xl">Alertes de commande sur téléphone</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-encre/60">Notification push (ntfy)</p>
            {ntfy ? (
              <>
                <p className="mt-2 text-sm text-encre/70">
                  Installez l&apos;application <strong className="font-medium text-encre">ntfy</strong>{" "}
                  (Android ou iPhone), touchez « + » et abonnez-vous au canal :
                </p>
                <p className="mt-2 break-all border border-encre/15 bg-creme px-3 py-2 font-mono text-sm">
                  {ntfy.canal}
                </p>
                <p className="mt-2 text-xs text-encre/60">
                  Ce nom de canal fait office de mot de passe : ne le partagez pas.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-terracotta">Non configurée : variable NTFY_TOPIC absente.</p>
            )}
            <Resultat valeur={push} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-encre/60">WhatsApp (CallMeBot)</p>
            <p className="mt-2 text-sm text-encre/70">
              Vers <strong className="font-medium text-encre">{formaterNumero(numeroWhatsapp())}</strong>
              {process.env.CALLMEBOT_APIKEY
                ? "."
                : " : en attente de la clé CallMeBot (variable CALLMEBOT_APIKEY)."}
            </p>
            <Resultat valeur={whatsapp} />
          </div>
        </div>
        <form action={envoyerAlertesTest} className="mt-6">
          <button
            type="submit"
            className="border border-encre/25 px-4 py-2 text-xs tracking-wide hover:border-terracotta hover:text-terracotta"
          >
            Envoyer une alerte de test
          </button>
        </form>
      </section>
    </>
  );
}
