import Link from "next/link";
import { SelecteurLangue } from "./SelecteurLangue";
import { TEXTES, avecLangue, type Langue } from "@/lib/actualites-i18n";

export type RubriqueNav = "une" | "decouvertes" | "agenda" | "artistes";

// Barre de navigation de la rubrique : accueil de l'actualité, agenda, artistes
// cités, recherche et langue. Présente sur toutes les pages de la rubrique pour
// qu'on s'y retrouve toujours.
export function NavActu({
  langue,
  active,
  chemin,
  q = "",
}: {
  langue: Langue;
  active?: RubriqueNav;
  // Adresse de la page sans langue (pour le sélecteur de langue).
  chemin: string;
  q?: string;
}) {
  const t = TEXTES[langue];
  const liens: { cle: RubriqueNav; href: string; texte: string }[] = [
    { cle: "une", href: "/actualites", texte: t.aLaUne },
    { cle: "decouvertes", href: "/actualites?categorie=decouverte", texte: t.navDecouvertes },
    { cle: "agenda", href: "/actualites/agenda", texte: t.navAgenda },
    { cle: "artistes", href: "/actualites/artistes", texte: t.navArtistes },
  ];
  return (
    <div className="border-b border-fil bg-craie">
      {/* Le bloc du logo déborde sous l'en-tête : la barre commence à sa droite. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 py-3 pl-[9.5rem] pr-4 sm:pl-[11.5rem] sm:pr-6 md:pl-[14.5rem] md:pr-8">
        <nav aria-label={t.navAria} className="-mx-1 flex gap-1 overflow-x-auto">
          {liens.map((l) => (
            <Link
              key={l.cle}
              href={avecLangue(l.href, langue)}
              aria-current={active === l.cle ? "page" : undefined}
              className={`shrink-0 px-3 py-1.5 font-condense text-[15px] font-semibold uppercase tracking-[0.07em] transition-colors ${
                active === l.cle ? "bg-encre text-craie" : "text-encre/70 hover:bg-panel hover:text-encre"
              }`}
            >
              {l.texte}
            </Link>
          ))}
        </nav>
        <form action="/actualites" method="get" role="search" className="order-last flex min-w-[14rem] flex-1 items-center sm:order-none sm:max-w-md">
          {langue !== "fr" && <input type="hidden" name="lang" value={langue} />}
          <label htmlFor="recherche-actu" className="sr-only">
            {t.rechercher}
          </label>
          <input
            id="recherche-actu"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={80}
            placeholder={t.recherchePlaceholder}
            className="w-full border border-fil bg-creme px-3 py-2 text-sm outline-none transition-colors focus:border-terracotta"
          />
          <button
            type="submit"
            className="shrink-0 border border-encre bg-encre px-4 py-2 font-condense text-[14px] font-semibold uppercase tracking-[0.08em] text-craie transition-colors hover:bg-terracotta hover:border-terracotta"
          >
            {t.rechercher}
          </button>
        </form>
        <div className="ml-auto">
          <SelecteurLangue langue={langue} chemin={chemin} />
        </div>
      </div>
    </div>
  );
}
