import Link from "next/link";
import { CarteActualite, CarteAgenda, CarteVideo, LigneBreve, VedetteActualite } from "./ActualiteCards";
import { NavActu } from "./NavActu";
import { TitreSection } from "./TitreSection";
import {
  dateEditoriale,
  type Actualite,
  type Categorie,
  type Portee,
} from "@/lib/actualites-commun";
import { TEXTES, avecLangue, fmt, nombre, type Langue } from "@/lib/actualites-i18n";

export interface DonneesVueActualites {
  langue: Langue;
  // Recherche libre en cours (filtre les articles, masque la une et l'agenda).
  q?: string;
  portee?: Portee;
  categorie?: Categorie;
  page: number;
  vedette: Actualite | null;
  articles: Actualite[];
  enBref: Actualite[];
  agenda: Actualite[];
  enVideo: Actualite[];
  // Portraits du jour (« Découverte d'artistes »), affichés sur la première page.
  decouvertes?: Actualite[];
  total: number;
  suite: boolean;
  admin: boolean;
}

function chemin(filtre: { portee?: Portee; categorie?: Categorie; page?: number; q?: string }): string {
  const q = new URLSearchParams();
  if (filtre.q) q.set("q", filtre.q);
  if (filtre.portee) q.set("portee", filtre.portee);
  if (filtre.categorie) q.set("categorie", filtre.categorie);
  if (filtre.page && filtre.page > 1) q.set("page", String(filtre.page));
  const texte = q.toString();
  return texte ? `/actualites?${texte}` : "/actualites";
}

const ZONES = [undefined, "togo", "afrique", "monde"] as const;
const CATEGORIES_ORDRE: Categorie[] = ["decouverte", "expositions", "marche", "artistes", "evenements", "institutions", "patrimoine", "creation", "general"];
const RUBRIQUES = [undefined, ...CATEGORIES_ORDRE] as const;

// Page d'accueil de l'actualité : « à la une » plein cadre, agenda de Lomé,
// découvertes, vidéos, colonne d'articles et brèves. Sans accès à la base de données.
export function VueActualites({ langue, q = "", portee, categorie, page, vedette, articles, enBref, agenda, enVideo, decouvertes = [], total, suite, admin }: DonneesVueActualites) {
  const t = TEXTES[langue];
  const recherche = q.trim().length > 0;
  const filtreActif = Boolean(portee || categorie || recherche);
  const premierePage = page === 1;
  const montrerAgenda = premierePage && !categorie && !q.trim() && (!portee || portee === "togo") && agenda.length > 0;
  const lien = (f: { portee?: Portee; categorie?: Categorie; page?: number }) => avecLangue(chemin({ ...f, q: q || undefined }), langue);
  // Rangée de cartes : défilement horizontal aimanté sur mobile, grille ensuite.
  const rangee = "defile-x -mx-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3";

  return (
    <div lang={langue}>
      <NavActu langue={langue} active={categorie === "decouverte" ? "decouvertes" : "une"} chemin={chemin({ portee, categorie, page, q: q || undefined })} q={q} />
      <header className="border-b border-fil bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 md:px-8 md:pb-10 md:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h1 className="font-display text-[3.6rem] font-medium leading-[0.92] sm:text-7xl md:text-[6.5rem]">{t.titreSection}</h1>
            <p className="pb-1.5 text-sm text-gris sm:text-right">
              <span className="block font-medium text-encre">{dateEditoriale(new Date(), langue)}</span>
              {t.baseline}
            </p>
          </div>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-gris">{t.intro}</p>

          <nav aria-label={t.zonesAria} className="defile-x -mx-4 mt-8 px-4 sm:mx-0 sm:px-0">
            <div className="inline-flex rounded-full border border-fil bg-creme p-1">
              {ZONES.map((valeur) => {
                const actif = portee === valeur;
                return (
                  <Link
                    key={valeur ?? "tout"}
                    href={lien({ portee: valeur, categorie })}
                    aria-current={actif ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium transition-colors duration-150 ${
                      actif ? "bg-terracotta text-craie" : "text-encre/70 hover:text-encre"
                    }`}
                  >
                    {valeur ? t.zones[valeur] : t.aLaUne}
                  </Link>
                );
              })}
            </div>
          </nav>
          <nav aria-label={t.rubriquesAria} className="defile-x -mx-4 mt-4 px-4 sm:mx-0 sm:px-0">
            {RUBRIQUES.map((valeur) => {
              const actif = categorie === valeur;
              return (
                <Link
                  key={valeur ?? "toutes"}
                  href={lien({ portee, categorie: valeur })}
                  aria-current={actif ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors duration-150 ${
                    actif ? "border-encre bg-encre text-craie" : "border-fil text-encre/75 hover:border-encre hover:text-encre"
                  }`}
                >
                  {valeur ? t.categories[valeur] : t.toutesRubriques}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {recherche && (
        <p role="status" className="mx-auto max-w-7xl px-4 pt-8 font-display text-2xl sm:px-6 md:px-8">
          {articles.length === 0 ? fmt(t.aucunResultat, { q }) : fmt(t.resultats[total === 1 ? 0 : 1], { n: total, q })}{" "}
          <Link href={avecLangue("/actualites", langue)} className="ml-2 font-sans text-sm text-terracotta underline underline-offset-4">
            {t.effacer}
          </Link>
        </p>
      )}

      {!vedette && articles.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8">
          <div className="rounded-3xl border border-fil bg-craie px-6 py-16 text-center">
            <p className="font-display text-3xl">{filtreActif ? t.videFiltre : t.vide}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gris">
              {filtreActif ? t.videFiltreTexte : t.videTexte}
            </p>
            {filtreActif && (
              <Link href={avecLangue("/actualites", langue)} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-encre px-6 text-sm font-medium hover:bg-encre hover:text-creme">
                {t.voirTout}
              </Link>
            )}
            {admin && !filtreActif && (
              <Link href="/admin/actualites" className="mt-6 block text-sm text-terracotta underline underline-offset-4">
                {t.premiereCollecte}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {vedette && premierePage && !recherche && <VedetteActualite a={vedette} langue={langue} />}

          {montrerAgenda && (
            <section aria-labelledby="agenda-lome" className="bg-panel">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                  <TitreSection id="agenda-lome">{t.agendaTitre}</TitreSection>
                  <p className="text-sm text-gris">
                    {t.agendaSous}{" "}
                    <Link href={avecLangue("/actualites/agenda", langue)} className="text-encre underline underline-offset-4 hover:text-terracotta">
                      {t.agendaTout}
                    </Link>
                  </p>
                </div>
                <ul className="defile-x -mx-4 mt-8 px-4 pb-2 md:mx-0 md:grid md:gap-3 md:overflow-visible md:px-0 md:pb-0 md:[grid-template-columns:repeat(auto-fit,minmax(15.5rem,1fr))]">
                  {agenda.map((a) => (
                    <CarteAgenda key={a.id} a={a} langue={langue} />
                  ))}
                </ul>
              </div>
            </section>
          )}

          {premierePage && !filtreActif && decouvertes.length > 0 && (
            <section aria-labelledby="decouvertes-jour" className="border-b border-fil bg-craie">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                  <TitreSection id="decouvertes-jour">{t.decouvertesTitre}</TitreSection>
                  <p className="text-sm text-gris">
                    {t.decouvertesSous}{" "}
                    <Link href={avecLangue("/actualites?categorie=decouverte", langue)} className="text-encre underline underline-offset-4 hover:text-terracotta">
                      {t.toutesDecouvertes}
                    </Link>
                  </p>
                </div>
                <div className={`mt-8 ${rangee}`}>
                  {decouvertes.map((a) => (
                    <div key={a.id} className="w-[82%] sm:w-auto">
                      <CarteActualite a={a} langue={langue} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {premierePage && !filtreActif && enVideo.length > 0 && (
            <section aria-labelledby="bande-video" className="border-b border-fil bg-creme">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
                <TitreSection id="bande-video">{t.aVoirVideo}</TitreSection>
                <div className={`mt-8 ${rangee}`}>
                  {enVideo.map((a) => (
                    <div key={a.id} className="w-[82%] sm:w-auto">
                      <CarteVideo a={a} langue={langue} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
              <div>
                <TitreSection>{filtreActif ? t.articles : t.dernieres}</TitreSection>
                {articles.length > 0 ? (
                  <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2">
                    {articles.map((a) => (
                      <CarteActualite key={a.id} a={a} langue={langue} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gris">{t.pasAutre}</p>
                )}
              </div>

              <aside aria-labelledby="en-bref" className="lg:sticky lg:top-36 lg:self-start">
                <TitreSection id="en-bref" niveau={2}>
                  {t.enBref}
                </TitreSection>
                <ul className="mt-4">
                  {enBref.map((a) => (
                    <LigneBreve key={a.id} a={a} langue={langue} />
                  ))}
                </ul>
                <div className="mt-8 rounded-2xl border border-fil bg-craie p-5 text-sm leading-relaxed text-gris">
                  <p className="font-display text-xl text-encre">{t.inviteTitre}</p>
                  <p className="mt-2">
                    {fmt(t.inviteTexte, { mail: "artovacorp@gmail.com" })}
                  </p>
                </div>
              </aside>
            </div>

            <nav aria-label={t.pagesAria} className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-fil pt-6 text-sm">
              {page > 1 ? (
                <Link href={lien({ portee, categorie, page: page - 1 })} className="inline-flex min-h-11 items-center rounded-full border border-encre px-6 font-medium transition-colors hover:bg-encre hover:text-creme">
                  {t.plusRecentes}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-gris">{nombre(t.publications, total)}</span>
              {suite ? (
                <Link href={lien({ portee, categorie, page: page + 1 })} className="inline-flex min-h-11 items-center rounded-full border border-encre px-6 font-medium transition-colors hover:bg-encre hover:text-creme">
                  {t.plusAnciennes}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
