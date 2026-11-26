import Link from "next/link";
import { NavActu } from "./NavActu";
import { PortraitPersonne } from "./PortraitPersonne";
import { TitreSection } from "./TitreSection";
import type { ResumePersonne } from "@/lib/actualites-personnes";
import { TEXTES, avecLangue, fmt, nombre, type Langue } from "@/lib/actualites-i18n";
import { normaliser } from "@/lib/actualites-flux";

function Carte({ p, langue }: { p: ResumePersonne; langue: Langue }) {
  const t = TEXTES[langue];
  return (
    <li>
      <Link
        href={avecLangue(`/actualites/artiste/${p.slug}`, langue)}
        className="group flex h-full items-center gap-3 rounded-2xl border border-fil bg-craie p-2.5 transition sm:gap-4 sm:p-3-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(27,26,23,0.35)]"
      >
        <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel sm:h-20 sm:w-20">
          <PortraitPersonne src={p.image} nom={p.nom} taille="text-2xl" />
        </span>
        <span className="min-w-0">
          {p.role && <span className="block text-xs font-medium text-terracotta">{t.roles[p.role]}</span>}
          <span className="block font-display text-[1.4rem] leading-tight group-hover:text-terracotta">{p.nom}</span>
          <span className="mt-0.5 block text-xs text-gris">{nombre(t.reportagesNb, p.nb)}</span>
        </span>
      </Link>
    </li>
  );
}

// Index des personnes citées dans l'actualité : photo, rôle, nombre de reportages,
// recherche par nom. Un nom mène à sa fiche, qui rassemble tous les reportages.
export function VueArtistesCites({ toutes, q, langue }: { toutes: ResumePersonne[]; q: string; langue: Langue }) {
  const t = TEXTES[langue];
  const cle = normaliser(q);
  const personnes = cle ? toutes.filter((p) => normaliser(p.nom).includes(cle)) : toutes;
  // Les plus cités d'abord, puis l'ordre alphabétique.
  const enVue = cle ? [] : toutes.filter((p) => p.nb >= 2).slice(0, 6);
  const parLettre = new Map<string, ResumePersonne[]>();
  for (const p of [...personnes].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))) {
    const l = p.nom.trim().charAt(0).toUpperCase().normalize("NFD").replace(/\p{M}/gu, "");
    const lettre = /[A-Z]/.test(l) ? l : "#";
    parLettre.set(lettre, [...(parLettre.get(lettre) ?? []), p]);
  }
  const lettres = [...parLettre.keys()];

  return (
    <div lang={langue}>
      <NavActu langue={langue} active="artistes" chemin="/actualites/artistes" />
      <header className="border-b border-fil bg-craie">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 md:px-8 md:pb-14 md:pt-14">
          <h1 className="font-display text-[2.8rem] font-medium leading-[0.98] text-balance sm:text-6xl md:text-7xl">{t.artistesTitre}</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-gris">{t.artistesIntro}</p>

          <form action="/actualites/artistes" method="get" role="search" className="mt-8 flex max-w-xl items-center gap-2">
            {langue !== "fr" && <input type="hidden" name="lang" value={langue} />}
            <label htmlFor="recherche-nom" className="sr-only">{t.rechercherNom}</label>
            <input
              id="recherche-nom"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={60}
              placeholder={t.rechercheNomPlaceholder}
              className="min-h-12 w-full rounded-full border border-fil bg-creme px-5 text-[16px] outline-none transition-colors focus:border-terracotta"
            />
            <button type="submit" className="min-h-12 shrink-0 rounded-full bg-encre px-6 text-sm font-medium text-creme transition-colors hover:bg-terracotta">
              {t.rechercher}
            </button>
          </form>

          {lettres.length > 1 && !q && (
            <nav aria-label="A–Z" className="mt-6 flex flex-wrap gap-1.5">
              {lettres.map((l) => (
                <a key={l} href={`#lettre-${l}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-fil text-sm font-medium transition-colors hover:border-encre hover:bg-encre hover:text-creme">
                  {l}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
        {q && (
          <p role="status" className="mb-8 text-sm text-gris">
            {personnes.length === 0 ? fmt(t.aucunNom, { q }) : `${personnes.length} · « ${q} »`}{" "}
            <Link href={avecLangue("/actualites/artistes", langue)} className="ml-2 text-terracotta underline underline-offset-4">{t.effacer}</Link>
          </p>
        )}

        {toutes.length === 0 ? (
          <p className="rounded-2xl border border-fil bg-craie px-6 py-14 text-center text-gris">{t.agendaVide}</p>
        ) : (
          <>
            {enVue.length > 0 && (
              <section aria-labelledby="plus-cites" className="mb-14">
                <TitreSection id="plus-cites">{t.plusCites}</TitreSection>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {enVue.map((p) => (
                    <Carte key={p.slug} p={p} langue={langue} />
                  ))}
                </ul>
              </section>
            )}
            {lettres.map((l) => (
              <section key={l} id={`lettre-${l}`} className="scroll-mt-28 border-t border-fil py-8 first:border-t-0">
                <h2 className="font-display text-5xl leading-none text-terracotta">{l}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(parLettre.get(l) ?? []).map((p) => (
                    <Carte key={p.slug} p={p} langue={langue} />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
