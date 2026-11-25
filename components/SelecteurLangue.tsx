import Link from "next/link";
import { LANGUES, TEXTES, avecLangue, type Langue } from "@/lib/actualites-i18n";

// Choix de la langue de la rubrique : français (par défaut), anglais, allemand.
// Chaque lien garde la page et ses filtres, seule la langue change.
export function SelecteurLangue({
  langue,
  chemin,
  claire = false,
}: {
  langue: Langue;
  // Adresse de la page sans langue, filtres compris (ex. « /actualites?portee=togo »).
  chemin: string;
  claire?: boolean;
}) {
  return (
    <nav aria-label={TEXTES[langue].langueAria} className="flex items-center gap-1 font-condense text-[14px] font-semibold uppercase tracking-[0.08em]">
      {LANGUES.map((l, i) => {
        const actif = l.code === langue;
        return (
          <span key={l.code} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true" className={claire ? "text-craie/30" : "text-fil"}>|</span>}
            <Link
              href={avecLangue(chemin, l.code)}
              hrefLang={l.code}
              lang={l.code}
              title={l.nom}
              aria-current={actif ? "true" : undefined}
              className={`px-1.5 py-0.5 transition-colors ${
                actif
                  ? claire
                    ? "bg-craie text-encre"
                    : "bg-encre text-craie"
                  : claire
                    ? "text-craie/60 hover:text-craie"
                    : "text-gris hover:text-encre"
              }`}
            >
              {l.court}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
