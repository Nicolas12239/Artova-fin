import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getArtistePourUtilisateur } from "@/lib/artistes";
import { query } from "@/lib/db";
import { formatFcfa } from "@/lib/format";
import { soumettreMaPage, supprimerMonOeuvre } from "@/app/actions/artiste";
import { EncartCommission } from "@/components/FormAuth";
import {
  FormMaPage,
  FormMonOeuvre,
  type OeuvreArtisteInitiale,
} from "@/components/FormEspaceArtiste";
import { LIBELLE_STATUT_ARTISTE, LIBELLE_STATUT_OEUVRE, type Oeuvre } from "@/lib/types";

export const metadata = { title: "Mon espace artiste", robots: { index: false, follow: false }, };

function Etape({ faite, children }: { faite: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${faite ? "border-encre bg-encre text-craie" : "border-encre/30 text-transparent"}`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className={faite ? "text-encre" : "text-gris"}>{children}</span>
      <span className="sr-only">{faite ? "(fait)" : "(à faire)"}</span>
    </li>
  );
}

export default async function PageEspaceArtiste({
  searchParams,
}: {
  searchParams: Promise<{
    onglet?: string;
    edit?: string;
    ajout?: string;
    incomplet?: string;
    suppression?: string;
    bienvenue?: string;
  }>;
}) {
  const utilisateur = await getCurrentUser();
  if (!utilisateur) redirect("/connexion?next=/espace-artiste");
  if (utilisateur.role !== "artiste") redirect("/");
  const artiste = await getArtistePourUtilisateur(utilisateur.id);
  if (!artiste) redirect("/");

  const params = await searchParams;
  const ongletOeuvres = params.onglet === "oeuvres";
  const oeuvres = await query<Oeuvre>(
    "SELECT * FROM oeuvres WHERE artiste_id = ? ORDER BY oeuvre_maitre DESC, id DESC",
    [artiste.id],
  );
  const enEdition = params.edit ? oeuvres.find((o) => String(o.id) === params.edit) : undefined;
  const initialOeuvre: OeuvreArtisteInitiale | undefined = enEdition && {
    id: enEdition.id,
    titre: enEdition.titre,
    type: enEdition.type,
    prix_fcfa: enEdition.prix_fcfa,
    annee: enEdition.annee,
    dimensions: enEdition.dimensions,
    technique: enEdition.technique,
    description: enEdition.description,
    oeuvre_maitre: enEdition.oeuvre_maitre,
    statut: enEdition.statut,
    image_url: enEdition.image_url,
  };

  const etapes = {
    portrait: Boolean(artiste.portrait_url),
    histoire: artiste.histoire.length >= 80,
    oeuvre: oeuvres.length > 0,
  };
  const pret = etapes.portrait && etapes.histoire && etapes.oeuvre;
  const onglet = (actif: boolean) =>
    `-mb-px border-b-2 px-1 pb-4 text-[12px] uppercase tracking-[0.18em] transition-colors ${actif ? "border-encre text-encre" : "border-transparent text-gris hover:text-encre"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 md:px-8 md:pb-24 md:pt-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gris">Espace artiste</p>
          <h1 className="mt-3 break-words font-display text-4xl sm:text-5xl md:text-6xl">
            {artiste.nom}
          </h1>
          <p className="mt-4 inline-flex items-center gap-2 border border-fil bg-craie px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]">
            <span
              className={`h-2 w-2 rounded-full ${artiste.statut === "publie" ? "bg-[#3f7d4e]" : artiste.statut === "en_attente" ? "bg-[#d9a441]" : "bg-gris/50"}`}
              aria-hidden="true"
            />
            {LIBELLE_STATUT_ARTISTE[artiste.statut]}
          </p>
        </div>
        <Link
          href={`/artistes/${artiste.slug}`}
          className="font-display text-lg underline underline-offset-4 hover:no-underline"
        >
          {artiste.statut === "publie" ? "Voir ma page en ligne ↗" : "Prévisualiser ma page ↗"}
        </Link>
      </div>

      {params.bienvenue && (
        <div role="status" className="mt-10 border-l-2 border-terracotta bg-craie px-5 py-4">
          <p className="font-display text-xl">Bienvenue sur ArTova, {artiste.nom}.</p>
          <p className="mt-1 text-sm text-gris">
            Votre page a été envoyée à l&apos;équipe pour relecture. En attendant,
            ajoutez d&apos;autres œuvres pour enrichir votre univers.
          </p>
        </div>
      )}

      {artiste.statut !== "publie" && (
        <section className="mt-10 grid gap-8 border border-fil bg-craie p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          {artiste.statut === "brouillon" ? (
            <>
              <div>
                <h2 className="font-display text-2xl">Publier votre page</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gris">
                  Complétez ces trois étapes, puis soumettez votre page :
                  l&apos;équipe ArTova la relit et la met en ligne.
                </p>
                <ul className="mt-5 space-y-2.5">
                  <Etape faite={etapes.portrait}>Ajouter un portrait</Etape>
                  <Etape faite={etapes.histoire}>Raconter votre histoire (80 caractères min.)</Etape>
                  <Etape faite={etapes.oeuvre}>Ajouter au moins une œuvre</Etape>
                </ul>
                {params.incomplet && (
                  <p role="alert" className="mt-4 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
                    Votre page n&apos;est pas encore complète.
                  </p>
                )}
              </div>
              <form action={soumettreMaPage}>
                <button
                  type="submit"
                  disabled={!pret}
                  className="w-full bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
                >
                  Soumettre pour publication ↗
                </button>
              </form>
            </>
          ) : (
            <div>
              <h2 className="font-display text-2xl">Votre page est en cours de validation</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gris">
                L&apos;équipe ArTova relit votre page et la publie sous peu. Vous
                pouvez continuer à la modifier en attendant.
              </p>
            </div>
          )}
        </section>
      )}

      <nav className="mt-12 flex gap-8 border-b border-fil" aria-label="Sections de l'espace artiste">
        <Link href="/espace-artiste" className={onglet(!ongletOeuvres)}>
          Ma page
        </Link>
        <Link href="/espace-artiste?onglet=oeuvres" className={onglet(ongletOeuvres)}>
          Mes œuvres ({oeuvres.length})
        </Link>
      </nav>

      {!ongletOeuvres ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-14">
          <FormMaPage
            initial={{
              nom: artiste.nom,
              discipline: artiste.discipline,
              ville: artiste.ville,
              histoire: artiste.histoire,
              note_univers: artiste.note_univers,
              theme_primaire: artiste.theme_primaire,
              theme_accent: artiste.theme_accent,
              theme_fond: artiste.theme_fond,
              motif: artiste.motif,
              portrait_url: artiste.portrait_url,
              banniere_url: artiste.banniere_url,
              annee_debut: artiste.annee_debut,
              formation: artiste.formation,
              techniques: artiste.techniques,
              expositions: artiste.expositions,
            }}
          />
          <aside className="order-first pt-10 lg:order-none">
            <div className="lg:sticky lg:top-24">
              <EncartCommission />
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-12 pt-10 lg:grid-cols-[1fr_420px] lg:gap-14">
          <section>
            {params.ajout && (
              <p role="status" className="mb-6 border-l-2 border-encre pl-3 text-sm">
                Œuvre ajoutée à votre page.
              </p>
            )}
            {params.suppression === "impossible" && (
              <p role="alert" className="mb-6 border-l-2 border-terracotta pl-3 text-sm text-terracotta">
                Cette œuvre a déjà été commandée : elle ne peut pas être supprimée.
                Passez-la en « Vendue » ou « Réservée ».
              </p>
            )}
            {oeuvres.length === 0 ? (
              <div className="flex flex-col items-center border border-dashed border-encre/25 px-6 py-16 text-center">
                <p className="font-display text-2xl">Aucune œuvre pour le moment</p>
                <p className="mt-2 max-w-sm text-sm text-gris">
                  Ajoutez votre première œuvre avec le formulaire : photo, titre, prix
                  et quelques mots pour la présenter.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:gap-6">
                {oeuvres.map((oeuvre) => (
                  <li key={oeuvre.id} className={String(oeuvre.id) === params.edit ? "ring-1 ring-encre ring-offset-4 ring-offset-creme" : ""}>
                    <div className="relative flex aspect-[4/5] items-center justify-center bg-panel p-4">
                      <img
                        src={oeuvre.image_url}
                        alt={oeuvre.titre}
                        className="max-h-full max-w-full object-contain shadow-[0_8px_24px_rgba(27,26,23,0.14)]"
                      />
                      {oeuvre.oeuvre_maitre === 1 && (
                        <span className="absolute left-2 top-2 bg-encre px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-craie">
                          Maîtresse
                        </span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-[12px] uppercase tracking-[0.14em]">{oeuvre.titre}</p>
                    <p className="mt-1 text-xs text-gris">
                      {formatFcfa(oeuvre.prix_fcfa)} · {LIBELLE_STATUT_OEUVRE[oeuvre.statut]}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em]">
                      <Link
                        href={`/espace-artiste?onglet=oeuvres&edit=${oeuvre.id}`}
                        className="underline underline-offset-4 hover:no-underline"
                      >
                        Modifier
                      </Link>
                      <form action={supprimerMonOeuvre.bind(null, oeuvre.id)}>
                        <button type="submit" className="uppercase tracking-[0.14em] text-gris hover:text-terracotta">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="border border-fil bg-craie p-6 md:p-8 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl">
                {initialOeuvre ? "Modifier l'œuvre" : "Ajouter une œuvre"}
              </h2>
              {initialOeuvre && (
                <Link href="/espace-artiste?onglet=oeuvres" className="text-[11px] uppercase tracking-[0.14em] text-gris hover:text-encre">
                  Annuler
                </Link>
              )}
            </div>
            <div className="mt-6">
              <FormMonOeuvre key={initialOeuvre?.id ?? "nouvelle"} initial={initialOeuvre} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
