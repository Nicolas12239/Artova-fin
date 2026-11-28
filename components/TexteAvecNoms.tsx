import Link from "next/link";
import type { ReactNode } from "react";
import { avecLangue, type Langue } from "@/lib/actualites-i18n";
import { slugTag } from "@/lib/actualites-tags";

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Props {
  texte: string;
  noms: string[];
  // Noms déjà liés plus haut dans l'article (un seul lien par nom).
  vus: Set<string>;
  langue: Langue;
}

const ADRESSE = /(https:\/\/[^\s<>"«»]*[^\s<>"«».,;:!?)])/g;

// Texte d'un article : les adresses web deviennent cliquables, et la première
// mention de chaque personne citée mène à sa fiche.
export function TexteAvecNoms(props: Props) {
  return (
    <>
      {props.texte.split(ADRESSE).map((partie, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={partie}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="break-all underline decoration-terracotta/50 underline-offset-[5px] transition-colors hover:text-terracotta"
          >
            {partie.replace(/^https:\/\/(www\.)?/, "")}
          </a>
        ) : (
          <Noms key={i} {...props} texte={partie} />
        ),
      )}
    </>
  );
}

// Transforme la première mention de chaque personne citée en lien vers sa fiche :
// on peut cliquer un nom dans le texte pour savoir qui c'est.
function Noms({
  texte,
  noms,
  vus,
  langue,
}: Props) {
  const restants = [...new Set(noms)].filter((n) => n.length >= 4 && !vus.has(n)).sort((a, b) => b.length - a.length);
  if (restants.length === 0) return <>{texte}</>;
  const motif = new RegExp(`(?<![\\p{L}\\p{N}])(${restants.map(echapper).join("|")})(?![\\p{L}\\p{N}])`, "u");
  const morceaux: ReactNode[] = [];
  let reste = texte;
  for (let garde = 0; garde < 40; garde++) {
    const m = motif.exec(reste);
    if (!m) break;
    const nom = m[1];
    if (vus.has(nom)) {
      // déjà lié : on le laisse en texte et on continue après cette occurrence
      morceaux.push(reste.slice(0, m.index + nom.length));
      reste = reste.slice(m.index + nom.length);
      continue;
    }
    vus.add(nom);
    morceaux.push(reste.slice(0, m.index));
    morceaux.push(
      <Link
        key={`${nom}-${garde}`}
        href={avecLangue(`/actualites/artiste/${slugTag(nom)}`, langue)}
        className="underline decoration-terracotta/50 decoration-1 underline-offset-[5px] transition-colors hover:text-terracotta hover:decoration-terracotta"
      >
        {nom}
      </Link>,
    );
    reste = reste.slice(m.index + nom.length);
    if (restants.every((n) => vus.has(n))) break;
  }
  morceaux.push(reste);
  return <>{morceaux}</>;
}
