import Link from "next/link";
import { RechercheActu } from "./RechercheActu";
import { SelecteurLangue } from "./SelecteurLangue";
import { TEXTES, avecLangue, type Langue } from "@/lib/actualites-i18n";

export type RubriqueNav = "une" | "decouvertes" | "agenda" | "artistes";

// Barre de la rubrique, collée sous l'en-tête : à la une, découvertes, agenda,
// artistes cités, recherche et langue. Présente sur toutes les pages de la
// rubrique pour qu'on s'y retrouve toujours.
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
    <div className="sticky top-16 z-30 border-b border-fil bg-craie/90 backdrop-blur-md supports-[backdrop-filter]:bg-craie/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:px-8">
        <nav aria-label={t.navAria} className="defile-x -mx-1 min-w-0 flex-1 gap-1 px-1 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] md:flex-none md:[mask-image:none]">
          {liens.map((l) => (
            <Link
              key={l.cle}
              href={avecLangue(l.href, langue)}
              aria-current={active === l.cle ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
                active === l.cle ? "bg-encre text-craie" : "text-encre/75 hover:bg-panel hover:text-encre"
              }`}
            >
              {l.texte}
            </Link>
          ))}
        </nav>
        <RechercheActu langue={langue} q={q} libelle={t.rechercher} placeholder={t.recherchePlaceholder} />
        <div className="md:ml-auto">
          <SelecteurLangue langue={langue} chemin={chemin} />
        </div>
      </div>
    </div>
  );
}
