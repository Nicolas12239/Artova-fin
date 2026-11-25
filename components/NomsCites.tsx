import Link from "next/link";
import { TEXTES, type Langue } from "@/lib/actualites-i18n";

export interface PersonneAffichee {
  nom: string;
  slug: string | null;
  portrait_url: string | null;
}

// Noms cités dans l'article. Quand la personne est un artiste ArTova, son portrait
// et un lien vers sa page apparaissent ; sinon, une pastille avec son initiale.
export function NomsCites({ personnes, langue }: { personnes: PersonneAffichee[]; langue: Langue }) {
  if (personnes.length === 0) return null;
  const t = TEXTES[langue];
  return (
    <section aria-labelledby="noms-cites" className="mt-14">
      <h2 id="noms-cites" className="border-t-[6px] border-encre pt-3 font-condense text-4xl font-bold uppercase leading-none">
        {t.nomsCites}
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {personnes.map((p) => {
          const contenu = (
            <>
              {p.portrait_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.portrait_url} alt={p.nom} loading="lazy" className="h-14 w-14 shrink-0 object-cover" />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center bg-panel font-display text-2xl text-encre/70"
                >
                  {p.nom.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-display text-xl leading-tight">{p.nom}</span>
                {p.slug && <span className="block text-xs text-terracotta">{t.voirSaPage} →</span>}
              </span>
            </>
          );
          return (
            <li key={p.nom}>
              {p.slug ? (
                <Link href={`/artistes/${p.slug}`} className="flex items-center gap-4 border border-fil bg-craie p-2 transition-colors hover:border-encre">
                  {contenu}
                </Link>
              ) : (
                <div className="flex items-center gap-4 border border-fil p-2">{contenu}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
