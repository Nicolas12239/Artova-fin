import Link from "next/link";
import { CarteActualite, CarteAgenda, CarteVideo, LigneBreve, VedetteActualite } from "./ActualiteCards";
import { NavActu } from "./NavActu";
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

// Page d'accueil de l'actualité : titre de presse, « à la une » plein cadre,
// agenda de Lomé, colonnes d'articles et brèves. Sans accès à la base de données.
export function VueActualites({ langue, q = "", portee, categorie, page, vedette, articles, enBref, agenda, enVideo, decouvertes = [], total, suite, admin }: DonneesVueActualites) {
  const t = TEXTES[langue];
  const recherche = q.trim().length > 0;
  const filtreActif = Boolean(portee || categorie || recherche);
  const premierePage = page === 1;
  const montrerAgenda = premierePage && !categorie && !q.trim() && (!portee || portee === "togo") && agenda.length > 0;
  const lien = (f: { portee?: Portee; categorie?: Categorie; page?: number }) => avecLangue(chemin({ ...f, q: q || undefined }), langue);

  return (
    <div lang={langue}>
      <NavActu langue={langue} active={categorie === "decouverte" ? "decouvertes" : "une"} chemin={chemin({ portee, categorie, page, q: q || undefined })} q={q} />
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 md:px-8 md:pt-10">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h1 className="font-condense text-[3.5rem] font-bold uppercase leading-[0.9] sm:text-7xl md:text-[7.5rem]">
              {t.titreSection}
            </h1>
            <p className="pb-1.5 font-condense text-lg font-semibold uppercase tracking-[0.06em] sm:text-right">
              {dateEditoriale(new Date(), langue)}
              <span className="block text-sm font-medium normal-case tracking-normal text-gris">{t.baseline}</span>
            </p>
          </div>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gris">{t.intro}</p>

          <nav aria-label={t.zonesAria} className="-mx-4 mt-8 flex gap-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {ZONES.map((valeur) => {
              const actif = portee === valeur;
              return (
                <Link
                  key={valeur ?? "tout"}
                  href={lien({ portee: valeur, categorie })}
                  aria-current={actif ? "page" : undefined}
                  className={`shrink-0 border-b-[3px] pb-1 font-condense text-[1.6rem] font-bold uppercase leading-none tracking-[0.02em] transition-colors ${
                    actif ? "border-terracotta text-terracotta" : "border-transparent text-encre/55 hover:text-encre"
                  }`}
                >
                  {valeur ? t.zones[valeur] : t.aLaUne}
                </Link>
              );
            })}
          </nav>
          <nav aria-label={t.rubriquesAria} className="-mx-4 flex gap-6 overflow-x-auto border-t border-fil px-4 py-3.5 sm:mx-0 sm:px-0">
            {RUBRIQUES.map((valeur) => {
              const actif = categorie === valeur;
              return (
                <Link
                  key={valeur ?? "toutes"}
                  href={lien({ portee, categorie: valeur })}
                  aria-current={actif ? "page" : undefined}
                  className={`shrink-0 font-condense text-[15px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    actif ? "text-terracotta underline decoration-2 underline-offset-[6px]" : "text-gris hover:text-encre"
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
        <p role="status" className="mx-auto max-w-7xl px-4 pt-8 font-condense text-xl font-semibold uppercase tracking-[0.05em] sm:px-6 md:px-8">
          {articles.length === 0 ? fmt(t.aucunResultat, { q }) : fmt(t.resultats[total === 1 ? 0 : 1], { n: total, q })}{" "}
          <Link href={avecLangue("/actualites", langue)} className="ml-2 text-sm font-medium normal-case tracking-normal text-terracotta underline underline-offset-4">
            {t.effacer}
          </Link>
        </p>
      )}

      {!vedette && articles.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8">
          <div className="border border-fil bg-craie px-6 py-16 text-center">
            <p className="font-display text-3xl">{filtreActif ? t.videFiltre : t.vide}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gris">
              {filtreActif ? t.videFiltreTexte : t.videTexte}
            </p>
            {filtreActif && (
              <Link href={avecLangue("/actualites", langue)} className="mt-6 inline-block border-b border-terracotta pb-1 text-sm">
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
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-[6px] border-encre pt-4">
                  <h2 id="agenda-lome" className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
                    {t.agendaTitre}
                  </h2>
                  <p className="text-sm text-gris">
                    {t.agendaSous}{" "}
                    <Link href={avecLangue("/actualites/agenda", langue)} className="text-encre underline underline-offset-4 hover:text-terracotta">
                      {t.agendaTout}
                    </Link>
                  </p>
                </div>
                <ul className="mt-6 grid gap-px bg-fil [grid-template-columns:repeat(auto-fit,minmax(15.5rem,1fr))]">
                  {agenda.map((a) => (
                    <CarteAgenda key={a.id} a={a} langue={langue} />
                  ))}
                </ul>
              </div>
            </section>
          )}

          {premierePage && !filtreActif && decouvertes.length > 0 && (
            <section aria-labelledby="decouvertes-jour" className="border-b border-fil bg-craie">
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-[6px] border-encre pt-4">
                  <h2 id="decouvertes-jour" className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
                    {t.decouvertesTitre}
                  </h2>
                  <p className="text-sm text-gris">
                    {t.decouvertesSous}{" "}
                    <Link href={avecLangue("/actualites?categorie=decouverte", langue)} className="text-encre underline underline-offset-4 hover:text-terracotta">
                      {t.toutesDecouvertes}
                    </Link>
                  </p>
                </div>
                <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {decouvertes.map((a) => (
                    <CarteActualite key={a.id} a={a} langue={langue} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {premierePage && !filtreActif && enVideo.length > 0 && (
            <section aria-labelledby="bande-video" className="border-y border-fil bg-craie">
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">
                <h2 id="bande-video" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
                  {t.aVoirVideo}
                </h2>
                <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {enVideo.map((a) => (
                    <CarteVideo key={a.id} a={a} langue={langue} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-0">
              <div className="lg:pr-10">
                <h2 className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
                  {filtreActif ? t.articles : t.dernieres}
                </h2>
                {articles.length > 0 ? (
                  <div className="mt-2 grid sm:grid-cols-2">
                    {articles.map((a) => (
                      <div
                        key={a.id}
                        className="border-t border-fil py-8 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-7 sm:[&:nth-child(odd)]:pr-7"
                      >
                        <CarteActualite a={a} langue={langue} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gris">{t.pasAutre}</p>
                )}
              </div>

              <aside aria-labelledby="en-bref" className="lg:border-l lg:border-fil lg:pl-8">
                <h2 id="en-bref" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
                  {t.enBref}
                </h2>
                <ul className="mt-4">
                  {enBref.map((a) => (
                    <LigneBreve key={a.id} a={a} langue={langue} />
                  ))}
                </ul>
                <div className="mt-8 border border-fil bg-craie p-5 text-sm leading-relaxed text-gris">
                  <p className="font-display text-xl text-encre">{t.inviteTitre}</p>
                  <p className="mt-2">
                    {fmt(t.inviteTexte, { mail: "artovacorp@gmail.com" })}
                  </p>
                </div>
              </aside>
            </div>

            <nav aria-label={t.pagesAria} className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-fil pt-6 font-condense text-base font-semibold uppercase tracking-[0.06em]">
              {page > 1 ? (
                <Link href={lien({ portee, categorie, page: page - 1 })} className="underline underline-offset-4 hover:text-terracotta">
                  {t.plusRecentes}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-gris">{nombre(t.publications, total)}</span>
              {suite ? (
                <Link href={lien({ portee, categorie, page: page + 1 })} className="underline underline-offset-4 hover:text-terracotta">
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
