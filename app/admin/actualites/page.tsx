import Link from "next/link";
import { BoutonCollecte, FormPublication, FormSource } from "@/components/FormActualitesAdmin";
import {
  basculerALaUne,
  basculerSource,
  basculerStatutActualite,
  retirerCommentaire,
  supprimerActualite,
  supprimerSource,
} from "@/app/actions/actualites";
import { query } from "@/lib/db";
import { iaDisponible } from "@/lib/actualites-ia";
import type { SourceActualite } from "@/lib/actualites-collecte";
import { CATEGORIES, LIBELLE_PORTEE, actualiteParId, ilYa, lienActualite, type Actualite } from "@/lib/actualites";

export const metadata = { title: "Actualités | Administration" };
// La collecte lancée depuis cette page s'arrête d'elle-même avant 60 s.
export const maxDuration = 60;

const lienDiscret = "text-xs text-gris underline underline-offset-4 hover:text-terracotta";

export default async function PageAdminActualites({
  searchParams,
}: {
  searchParams: Promise<{ modifier?: string }>;
}) {
  const { modifier } = await searchParams;
  const aModifier = Number(modifier) > 0 ? await actualiteParId(Number(modifier)) : null;
  const [articles, sources, commentaires, artistes, bilan] = await Promise.all([
    query<Actualite>(
      `SELECT a.id, a.titre, a.source_nom, a.portee, a.categorie, a.statut, a.origine, a.a_la_une, a.publie_le,
        DATE_FORMAT(a.evenement_debut, '%Y-%m-%d') AS evenement_debut, DATE_FORMAT(a.evenement_fin, '%Y-%m-%d') AS evenement_fin, a.lieu,
        (SELECT COUNT(*) FROM actualites_likes l WHERE l.actualite_id = a.id) AS nb_likes,
        (SELECT COUNT(*) FROM actualites_commentaires c WHERE c.actualite_id = a.id AND c.statut = 'publie') AS nb_commentaires
       FROM actualites a ORDER BY a.publie_le DESC, a.id DESC LIMIT 40`,
    ),
    query<SourceActualite>("SELECT * FROM sources_actualites ORDER BY actif DESC, FIELD(portee,'togo','afrique','monde'), nom"),
    query<{ id: number; actualite_id: number; titre: string; auteur: string; texte: string; cree_le: Date }>(
      `SELECT c.id, c.actualite_id, a.titre, u.nom AS auteur, c.texte, c.cree_le
       FROM actualites_commentaires c
       JOIN actualites a ON a.id = c.actualite_id
       JOIN utilisateurs u ON u.id = c.utilisateur_id
       WHERE c.statut = 'publie' ORDER BY c.cree_le DESC LIMIT 15`,
    ),
    query<{ slug: string; nom: string }>("SELECT slug, nom FROM artistes WHERE statut = 'publie' ORDER BY nom"),
    query<{ total: number; publiees: number; likes: number; commentaires: number }>(
      `SELECT (SELECT COUNT(*) FROM actualites) AS total,
              (SELECT COUNT(*) FROM actualites WHERE statut = 'publie') AS publiees,
              (SELECT COUNT(*) FROM actualites_likes) AS likes,
              (SELECT COUNT(*) FROM actualites_commentaires WHERE statut = 'publie') AS commentaires`,
    ),
  ]);
  const b = bilan[0];
  const ia = iaDisponible();
  const cron = Boolean(process.env.CRON_SECRET);

  return (
    <div className="space-y-16">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl md:text-3xl">L&apos;actualité de l&apos;art</h2>
          <Link href="/actualites" className={lienDiscret}>Voir la page publique</Link>
        </div>
        <p className="mt-3 text-sm text-gris">
          {Number(b?.publiees ?? 0)} publiée(s) sur {Number(b?.total ?? 0)} · {Number(b?.likes ?? 0)} j&apos;aime ·{" "}
          {Number(b?.commentaires ?? 0)} commentaire(s)
        </p>

        <ul className="mt-6 space-y-2 text-sm">
          <li className={cron ? "" : "text-terracotta"}>
            {cron
              ? "Collecte automatique : chaque matin vers 5 h 30 (heure de Lomé)."
              : "Collecte automatique désactivée : ajoutez la variable CRON_SECRET sur Vercel puis redéployez."}
          </li>
          <li className={ia ? "" : "text-terracotta"}>
            {ia
              ? "Tri et résumés par l'IA : actifs."
              : "Tri et résumés par l'IA : inactifs. Ajoutez ANTHROPIC_API_KEY sur Vercel pour des résumés en français, un vrai tri et un classement par importance. Sans elle, ArTova trie par mots-clés et reprend l'extrait d'origine."}
          </li>
        </ul>
        <div className="mt-6">
          <BoutonCollecte />
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-2xl">Dernières publications</h2>
          {articles.length === 0 ? (
            <p className="mt-4 text-sm text-gris">Rien pour l&apos;instant : lancez une collecte ou publiez à la main.</p>
          ) : (
            <ul className="mt-5 divide-y divide-fil border-y border-fil">
              {articles.map((a) => (
                <li key={a.id} className={`py-4 ${a.statut === "masque" ? "opacity-55" : ""}`}>
                  <Link href={lienActualite(a)} className="font-display text-xl leading-snug underline-offset-4 hover:underline">
                    {a.titre}
                  </Link>
                  <p className="mt-1 text-xs text-gris">
                    {LIBELLE_PORTEE[a.portee]} · {CATEGORIES[a.categorie]} · {a.source_nom} · {ilYa(a.publie_le)} ·{" "}
                    {a.origine === "manuel" ? "manuel" : "automatique"} · {a.nb_likes} j&apos;aime · {a.nb_commentaires} com.
                    {a.a_la_une ? " · à la une" : ""}
                    {a.statut === "masque" ? " · masquée" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                    <Link href={`/admin/actualites?modifier=${a.id}#formulaire`} className={lienDiscret}>
                      Modifier
                    </Link>
                    <form action={basculerALaUne.bind(null, a.id)}>
                      <button className={lienDiscret}>{a.a_la_une ? "Retirer de la une" : "Mettre à la une"}</button>
                    </form>
                    <form action={basculerStatutActualite.bind(null, a.id)}>
                      <button className={lienDiscret}>{a.statut === "publie" ? "Masquer" : "Republier"}</button>
                    </form>
                    <form action={supprimerActualite.bind(null, a.id)}>
                      <button className={lienDiscret}>Supprimer</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="formulaire" className="scroll-mt-24">
          <h2 className="font-display text-2xl">{aModifier ? "Modifier l'actualité" : "Publier à la main"}</h2>
          <p className="mt-2 text-sm text-gris">
            {aModifier
              ? "Complétez ou corrigez la fiche : lieu, dates, texte, image."
              : "Pour une info vue sur Instagram, TikTok ou reçue d'un artiste : ajoutez le lien de la source, une image et deux phrases."}
          </p>
          {aModifier && (
            <Link href="/admin/actualites" className={`${lienDiscret} mt-2 inline-block`}>
              Annuler et publier une nouvelle actualité
            </Link>
          )}
          <div className="mt-5">
            <FormPublication initial={aModifier ?? undefined} artistes={artistes} />
          </div>
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-2xl">Sources suivies</h2>
          <ul className="mt-5 divide-y divide-fil border-y border-fil">
            {sources.map((s) => (
              <li key={s.id} className={`py-3 ${s.actif ? "" : "opacity-55"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="text-sm">
                    <span className="font-medium">{s.nom}</span>{" "}
                    <span className="text-xs text-gris">
                      · {LIBELLE_PORTEE[s.portee]} · {s.langue.toUpperCase()} · {s.filtrer ? "généraliste, filtré" : "dédié à l'art"} ·{" "}
                      {s.nb_articles} publiée(s)
                    </span>
                  </p>
                  <div className="flex gap-4">
                    <form action={basculerSource.bind(null, s.id)}>
                      <button className={lienDiscret}>{s.actif ? "Mettre en pause" : "Réactiver"}</button>
                    </form>
                    <form action={supprimerSource.bind(null, s.id)}>
                      <button className={lienDiscret}>Supprimer</button>
                    </form>
                  </div>
                </div>
                <p className="mt-1 break-all text-xs text-gris/80">{s.url_flux}</p>
                {s.derniere_erreur ? (
                  <p className="mt-1 text-xs text-terracotta">Dernière lecture en échec : {s.derniere_erreur}</p>
                ) : s.derniere_collecte ? (
                  <p className="mt-1 text-xs text-gris">Lue {ilYa(s.derniere_collecte)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl">Ajouter une source</h2>
          <p className="mt-2 text-sm text-gris">
            Un site d&apos;actualité, un blog de galerie ou un magazine d&apos;art qui publie un flux RSS (souvent à l&apos;adresse /feed ou /rss).
          </p>
          <div className="mt-5">
            <FormSource />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Derniers commentaires</h2>
        {commentaires.length === 0 ? (
          <p className="mt-4 text-sm text-gris">Aucun commentaire pour l&apos;instant.</p>
        ) : (
          <ul className="mt-5 divide-y divide-fil border-y border-fil">
            {commentaires.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-gris">
                    {c.auteur} · {ilYa(c.cree_le)} · sur{" "}
                    <Link href={lienActualite({ id: c.actualite_id, titre: c.titre })} className="underline underline-offset-4">
                      {c.titre}
                    </Link>
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm">{c.texte}</p>
                </div>
                <form action={retirerCommentaire.bind(null, c.id)}>
                  <button className={lienDiscret}>Retirer</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
