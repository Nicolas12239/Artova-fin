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
    <nav
      aria-label={TEXTES[langue].langueAria}
      className={`flex items-center rounded-full border p-0.5 text-xs font-medium ${claire ? "border-craie/25" : "border-fil"}`}
    >
      {LANGUES.map((l) => {
        const actif = l.code === langue;
        return (
          <Link
            key={l.code}
            href={avecLangue(chemin, l.code)}
            hrefLang={l.code}
            lang={l.code}
            title={l.nom}
            aria-current={actif ? "true" : undefined}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2.5 transition-colors duration-150 ${
              actif
                ? claire
                  ? "bg-craie text-encre"
                  : "bg-encre text-craie"
                : claire
                  ? "text-craie/65 hover:text-craie"
                  : "text-gris hover:text-encre"
            }`}
          >
            {l.court}
          </Link>
        );
      })}
    </nav>
  );
}
