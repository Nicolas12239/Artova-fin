import { FormImport, FormSourceSociale } from "./FormReseaux";
import { basculerSourceSociale, supprimerSourceSociale } from "@/app/actions/actualites";
import { ilYa, LIBELLE_PORTEE } from "@/lib/actualites-commun";
import { connexions, NOMS_PLATEFORMES } from "@/lib/actualites-social-lecture";
import type { SourceSociale } from "@/lib/actualites-social";

const lien = "inline-flex min-h-9 items-center text-xs text-gris underline underline-offset-4 hover:text-terracotta";

// Bloc « Réseaux sociaux » de l'administration : état des connexions, import par
// lien, comptes suivis et marche à suivre pour connecter Meta.
export function ReseauxSociauxAdmin({ sources }: { sources: SourceSociale[] }) {
  const acces = connexions();
  const etats = [
    { nom: "Instagram (comptes et mots-dièse)", ok: acces.instagram, aide: "ajouter META_ACCESS_TOKEN et INSTAGRAM_BUSINESS_ID sur Vercel" },
    { nom: "Pages Facebook", ok: acces.facebook, aide: "ajouter FACEBOOK_PAGE_TOKEN (ou META_ACCESS_TOKEN) sur Vercel" },
    { nom: "Chaînes YouTube", ok: true, aide: "" },
    { nom: "Liens TikTok, Instagram, Facebook, YouTube", ok: true, aide: "" },
  ];
  return (
    <section aria-labelledby="reseaux" className="space-y-10">
      <div>
        <h2 id="reseaux" className="font-display text-2xl md:text-3xl">Réseaux sociaux</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {etats.map((e) => (
            <li key={e.nom} className={`rounded-2xl border p-4 text-sm ${e.ok ? "border-[#3f7d4e]/40" : "border-terracotta/50"}`}>
              <p className="font-medium">{e.nom}</p>
              <p className={`mt-1 text-xs ${e.ok ? "text-[#3f7d4e]" : "text-terracotta"}`}>
                {e.ok ? "Actif" : `En attente : ${e.aide}.`}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-xl">Reprendre une publication par son lien</h3>
          <p className="mt-2 text-sm text-gris">
            Fonctionne dès maintenant : YouTube et souvent TikTok donnent seuls le titre et la vignette ; sinon, collez la légende. Sur Android, avec ArTova installée depuis Chrome, le bouton « Partager » d&apos;Instagram ou de TikTok propose aussi ArTova.
          </p>
          <div className="mt-5"><FormImport /></div>
        </div>
        <div>
          <h3 className="font-display text-xl">Comptes suivis automatiquement</h3>
          <ul className="mt-4 divide-y divide-fil border-y border-fil">
            {sources.map((s) => (
              <li key={s.id} className={`py-3 ${s.actif ? "" : "opacity-55"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="text-sm">
                    <span className="font-medium">{s.nom}</span>{" "}
                    <span className="text-xs text-gris">
                      · {NOMS_PLATEFORMES[s.plateforme]} · {LIBELLE_PORTEE[s.portee]} · {s.nb_publications} reprise(s)
                    </span>
                  </p>
                  <div className="flex gap-4">
                    <form action={basculerSourceSociale.bind(null, s.id)}>
                      <button className={lien}>{s.actif ? "Mettre en pause" : "Réactiver"}</button>
                    </form>
                    <form action={supprimerSourceSociale.bind(null, s.id)}>
                      <button className={lien}>Supprimer</button>
                    </form>
                  </div>
                </div>
                {s.derniere_erreur ? (
                  <p className="mt-1 break-words text-xs text-terracotta">Dernière lecture en échec : {s.derniere_erreur}</p>
                ) : s.derniere_collecte ? (
                  <p className="mt-1 text-xs text-gris">Lu {ilYa(s.derniere_collecte)}</p>
                ) : (
                  <p className="mt-1 text-xs text-gris">Pas encore lu</p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6"><FormSourceSociale /></div>
        </div>
      </div>

      <details className="rounded-2xl border border-fil bg-craie p-5 text-sm leading-relaxed">
        <summary className="cursor-pointer font-medium">Connecter Instagram et Facebook (une seule fois)</summary>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Passer le compte Instagram d&apos;ArTova en compte professionnel et le relier à une page Facebook d&apos;ArTova.</li>
          <li>Créer une application sur developers.facebook.com, produit « Instagram », avec les autorisations instagram_basic et pages_read_engagement (instagram_manage_insights peut aussi être demandée).</li>
          <li>Générer un jeton d&apos;accès de longue durée et relever l&apos;identifiant du compte Instagram professionnel.</li>
          <li>Ajouter sur Vercel META_ACCESS_TOKEN et INSTAGRAM_BUSINESS_ID (et FACEBOOK_PAGE_TOKEN pour vos pages), puis redéployer.</li>
          <li>Pour les mots-dièse (« Instagram Public Content Access ») et les pages d&apos;autrui, Meta exige une validation de l&apos;application (App Review), parfois avec vérification de l&apos;entreprise.</li>
        </ol>
      </details>
    </section>
  );
}
