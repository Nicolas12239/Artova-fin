import Link from "next/link";
import { CarteActualite } from "./ActualiteCards";
import { CouvertureActualite } from "./CouvertureActualite";
import { NavActu } from "./NavActu";
import { PortraitPersonne } from "./PortraitPersonne";
import { TitreSection } from "./TitreSection";
import { lienActualite } from "@/lib/actualites";
import { contenuLangue, dateLongue } from "@/lib/actualites-commun";
import type { FichePersonne } from "@/lib/actualites-personnes";
import { TEXTES, avecLangue, fmt, nombre, type Langue } from "@/lib/actualites-i18n";
import { SITE_URL, urlAbsolue } from "@/lib/site";

// Fiche d'une personne citée dans l'actualité : qui c'est, ce qu'elle a fait dans
// chaque article, ses liens et tous les reportages à son sujet.
export function VueFichePersonne({ fiche, langue }: { fiche: FichePersonne; langue: Langue }) {
  const t = TEXTES[langue];
  const chemin = `/actualites/artiste/${fiche.slug}`;
  const avec = (c: string) => avecLangue(c, langue);
  const decouverte = fiche.bio?.article.categorie === "decouverte" ? fiche.bio.article : undefined;

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: fmt(t.tagTitre, { nom: fiche.nom }),
    inLanguage: langue,
    url: `${SITE_URL}${avec(chemin)}`,
    mainEntity: {
      "@type": "Person",
      name: fiche.nom,
      description: fiche.bio?.texte,
      image: fiche.image ? urlAbsolue(fiche.image) : undefined,
      url: fiche.slugArtova ? `${SITE_URL}/artistes/${fiche.slugArtova}` : undefined,
      sameAs: fiche.profils.length > 0 ? fiche.profils : undefined,
    },
  };

  return (
    <div lang={langue}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees).replace(/</g, "\\u003c") }} />
      <NavActu langue={langue} active="artistes" chemin={chemin} />

      <header className="border-b border-fil bg-craie">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 md:px-8 md:pb-16 md:pt-10">
          <nav aria-label={t.arianeAria} className="text-sm text-gris">
            <Link href={avec("/actualites")} className="hover:text-encre">{t.actuArt}</Link> /{" "}
            <Link href={avec("/actualites/artistes")} className="hover:text-encre">{t.navArtistes}</Link> /{" "}
            <span className="text-encre">{fiche.nom}</span>
          </nav>

          <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-12">
            <figure className="mx-auto w-full max-w-[15rem] md:mx-0">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-panel">
                <PortraitPersonne src={fiche.image} nom={fiche.nom} taille="text-7xl" />
              </div>
              {fiche.image && fiche.credit && (
                <figcaption className="mt-2 text-xs leading-snug text-gris">{fmt(t.creditPhoto, { credit: fiche.credit })}</figcaption>
              )}
            </figure>

            <div>
              {fiche.roles.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label={t.ficheRoles}>
                  {fiche.roles.map((r) => (
                    <li key={r.role} className="rounded-full border border-terracotta/40 px-3 py-1 text-xs font-medium text-terracotta">
                      {t.roles[r.role]}
                    </li>
                  ))}
                </ul>
              )}
              <h1 className="mt-4 font-display text-[3rem] font-medium leading-[0.98] text-balance sm:text-6xl md:text-7xl">{fiche.nom}</h1>
              <p className="mt-3 text-sm text-gris">{nombre(t.reportagesNb, fiche.nb)}</p>

              <h2 className="mt-8 font-display text-2xl">{fmt(t.ficheQui, { nom: fiche.nom })}</h2>
              <p className="mt-2 max-w-2xl text-[17px] leading-[1.75] text-encre/85">
                {fiche.bio ? fiche.bio.texte : fmt(t.ficheAucuneBio, { nom: fiche.nom })}
              </p>
              {fiche.bio && fiche.bio.article.categorie !== "decouverte" && (
                <p className="mt-2 text-sm text-gris">
                  <Link href={lienActualite(fiche.bio.article, langue)} className="underline underline-offset-4 hover:text-terracotta">
                    {fmt(t.ficheDans, { titre: contenuLangue(fiche.bio.article, langue).titre })}
                  </Link>
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {fiche.slugArtova && (
                  <Link
                    href={`/artistes/${fiche.slugArtova}`}
                    className="rounded-full bg-encre px-6 py-3 text-sm font-medium text-creme transition-colors hover:bg-terracotta"
                  >
                    {t.voirSaPage} →
                  </Link>
                )}
                {decouverte && (
                  <Link
                    href={lienActualite(decouverte, langue)}
                    className="rounded-full border border-encre px-6 py-3 text-sm font-medium transition-colors hover:bg-encre hover:text-creme"
                  >
                    {t.ficheDecouverte}
                  </Link>
                )}
                {fiche.profils.map((p) => (
                  <a
                    key={p}
                    href={p}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="rounded-full border border-fil px-6 py-3 text-sm transition-colors hover:border-encre"
                  >
                    {t.profilPublic} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-8 md:py-20">
        <TitreSection id="chronologie">{t.ficheChrono}</TitreSection>
        <ol className="mt-8 space-y-4">
          {fiche.reportages.map(({ a, role, note }) => {
            const c = contenuLangue(a, langue);
            return (
              <li key={a.id}>
                <Link
                  href={lienActualite(a, langue)}
                  className="group grid gap-4 rounded-2xl border border-fil bg-craie p-3 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(27,26,23,0.35)] sm:grid-cols-[11rem_1fr] sm:p-4"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-panel sm:aspect-auto sm:min-h-[7.5rem]">
                    <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} />
                  </div>
                  <div className="min-w-0 self-center">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gris">
                      <time dateTime={new Date(a.publie_le).toISOString()}>{dateLongue(a.publie_le, langue)}</time>
                      {role && <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 font-medium text-terracotta">{t.roles[role]}</span>}
                      {a.lieu && a.evenement_debut && <span>{a.lieu}</span>}
                    </p>
                    <h3 className="mt-1.5 font-display text-[1.5rem] leading-tight group-hover:text-terracotta">{c.titre}</h3>
                    {note && <p className="mt-1.5 text-[14px] leading-snug text-encre/75">{note}</p>}
                    {!note && <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-encre/70">{c.resume}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        {fiche.avec.length > 0 && (
          <section aria-labelledby="avec" className="mt-16">
            <TitreSection id="avec">{t.ficheAutresNoms}</TitreSection>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {fiche.avec.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={avec(`/actualites/artiste/${p.slug}`)}
                    className="inline-flex min-h-11 items-center rounded-full border border-fil bg-craie px-4 text-sm transition-colors hover:border-encre hover:bg-encre hover:text-creme"
                  >
                    {p.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fiche.reportages.length > 3 && (
          <section aria-labelledby="tous" className="mt-16">
            <TitreSection id="tous">{t.articles}</TitreSection>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {fiche.reportages.map(({ a }) => (
                <CarteActualite key={a.id} a={a} langue={langue} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
