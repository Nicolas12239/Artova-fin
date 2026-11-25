import Link from "next/link";
import { CarteActualite, CarteAgenda, LigneBreve, VedetteActualite } from "./ActualiteCards";
import {
  CATEGORIES,
  LIBELLE_PORTEE,
  dateEditoriale,
  type Actualite,
  type Categorie,
  type Portee,
} from "@/lib/actualites-commun";

export interface DonneesVueActualites {
  portee?: Portee;
  categorie?: Categorie;
  page: number;
  vedette: Actualite | null;
  articles: Actualite[];
  enBref: Actualite[];
  agenda: Actualite[];
  total: number;
  suite: boolean;
  admin: boolean;
}

function lien(filtre: { portee?: Portee; categorie?: Categorie; page?: number }): string {
  const q = new URLSearchParams();
  if (filtre.portee) q.set("portee", filtre.portee);
  if (filtre.categorie) q.set("categorie", filtre.categorie);
  if (filtre.page && filtre.page > 1) q.set("page", String(filtre.page));
  const texte = q.toString();
  return texte ? `/actualites?${texte}` : "/actualites";
}

const ZONES = [undefined, "togo", "afrique", "monde"] as const;
const RUBRIQUES = [undefined, ...(Object.keys(CATEGORIES) as Categorie[])] as const;

// Page d'accueil de l'actualité : titre de presse, « à la une » plein cadre,
// agenda de Lomé, colonnes d'articles et brèves. Sans accès à la base de données.
export function VueActualites({ portee, categorie, page, vedette, articles, enBref, agenda, total, suite, admin }: DonneesVueActualites) {
  const filtreActif = Boolean(portee || categorie);
  const premierePage = page === 1;
  const montrerAgenda = premierePage && !categorie && (!portee || portee === "togo") && agenda.length > 0;

  return (
    <div>
      <header className="border-b-[5px] border-encre bg-craie">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 md:px-8 md:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h1 className="font-condense text-[3.5rem] font-bold uppercase leading-[0.9] sm:text-7xl md:text-[7.5rem]">
              L&apos;actualité de l&apos;art
            </h1>
            <p className="pb-1.5 font-condense text-lg font-semibold uppercase tracking-[0.06em] sm:text-right">
              {dateEditoriale()}
              <span className="block text-sm font-medium normal-case tracking-normal text-gris">
                Togo, Afrique, monde : mis à jour chaque matin
              </span>
            </p>
          </div>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gris">
            Expositions, artistes, marché, musées et événements. ArTova repère, trie et résume l&apos;essentiel
            pour vous, avec la source toujours citée. Lecture libre, sans compte.
          </p>

          <nav aria-label="Zone géographique" className="-mx-4 mt-8 flex gap-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
                  {valeur ? LIBELLE_PORTEE[valeur] : "À la une"}
                </Link>
              );
            })}
          </nav>
          <nav aria-label="Rubriques" className="-mx-4 flex gap-6 overflow-x-auto border-t border-fil px-4 py-3.5 sm:mx-0 sm:px-0">
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
                  {valeur ? CATEGORIES[valeur] : "Toutes les rubriques"}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {!vedette && articles.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:px-8">
          <div className="border border-fil bg-craie px-6 py-16 text-center">
            <p className="font-display text-3xl">
              {filtreActif ? "Rien dans cette rubrique pour le moment" : "La première édition arrive"}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gris">
              {filtreActif
                ? "Essayez une autre zone ou une autre rubrique : l'actualité est mise à jour chaque matin."
                : "ArTova prépare sa veille quotidienne sur l'art togolais, africain et mondial. Revenez demain matin."}
            </p>
            {filtreActif && (
              <Link href="/actualites" className="mt-6 inline-block border-b border-terracotta pb-1 text-sm">
                Voir toute l&apos;actualité
              </Link>
            )}
            {admin && !filtreActif && (
              <Link href="/admin/actualites" className="mt-6 block text-sm text-terracotta underline underline-offset-4">
                Lancer la première collecte
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {vedette && premierePage && <VedetteActualite a={vedette} />}

          {montrerAgenda && (
            <section aria-labelledby="agenda-lome" className="bg-panel">
              <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-12">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-[6px] border-encre pt-4">
                  <h2 id="agenda-lome" className="font-condense text-4xl font-bold uppercase leading-none md:text-5xl">
                    Lomé, l&apos;agenda de l&apos;art
                  </h2>
                  <p className="text-sm text-gris">Expositions, vernissages et rencontres de la semaine</p>
                </div>
                <ul className="mt-6 grid gap-px bg-fil [grid-template-columns:repeat(auto-fit,minmax(15.5rem,1fr))]">
                  {agenda.map((a) => (
                    <CarteAgenda key={a.id} a={a} />
                  ))}
                </ul>
              </div>
            </section>
          )}

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-0">
              <div className="lg:pr-10">
                <h2 className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
                  {filtreActif ? "Les articles" : "Les dernières actualités"}
                </h2>
                {articles.length > 0 ? (
                  <div className="mt-2 grid sm:grid-cols-2">
                    {articles.map((a) => (
                      <div
                        key={a.id}
                        className="border-t border-fil py-8 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-7 sm:[&:nth-child(odd)]:pr-7"
                      >
                        <CarteActualite a={a} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gris">Pas d&apos;autre article pour le moment.</p>
                )}
              </div>

              <aside aria-labelledby="en-bref" className="lg:border-l lg:border-fil lg:pl-8">
                <h2 id="en-bref" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
                  En bref
                </h2>
                <ul className="mt-4">
                  {enBref.map((a) => (
                    <LigneBreve key={a.id} a={a} />
                  ))}
                </ul>
                <div className="mt-8 border border-fil bg-craie p-5 text-sm leading-relaxed text-gris">
                  <p className="font-display text-xl text-encre">Une exposition, un vernissage ?</p>
                  <p className="mt-2">
                    Artistes, galeries, collectifs : écrivez-nous à{" "}
                    <a className="text-encre underline underline-offset-4" href="mailto:artovacorp@gmail.com">
                      artovacorp@gmail.com
                    </a>{" "}
                    pour être dans l&apos;agenda.
                  </p>
                </div>
              </aside>
            </div>

            <nav aria-label="Pages" className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-fil pt-6 font-condense text-base font-semibold uppercase tracking-[0.06em]">
              {page > 1 ? (
                <Link href={lien({ portee, categorie, page: page - 1 })} className="underline underline-offset-4 hover:text-terracotta">
                  ← Plus récentes
                </Link>
              ) : (
                <span />
              )}
              <span className="text-gris">
                {total} publication{total > 1 ? "s" : ""}
              </span>
              {suite ? (
                <Link href={lien({ portee, categorie, page: page + 1 })} className="underline underline-offset-4 hover:text-terracotta">
                  Plus anciennes →
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
