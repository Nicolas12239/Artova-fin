import Link from "next/link";
import { PortraitPersonne } from "./PortraitPersonne";
import { TitreSection } from "./TitreSection";
import { lireEnquete, type RolePersonne } from "@/lib/actualites-commun";
import { TEXTES, avecLangue, fmt, nombre, type Langue } from "@/lib/actualites-i18n";
import { slugTag } from "@/lib/actualites-tags";

export interface PersonneAffichee {
  nom: string;
  // Page de l'artiste sur ArTova et son portrait, quand elle existe.
  slug: string | null;
  portrait_url: string | null;
  role?: RolePersonne;
  note?: string;
  image?: string;
  credit?: string;
  profil?: string;
  url?: string;
  // Nombre de reportages d'Actu art qui citent cette personne.
  nb?: number;
}

type Groupe = "artiste" | "organisation" | "presents" | "autres";

const GROUPE_DE: Record<RolePersonne, Groupe> = {
  artiste: "artiste",
  commissaire: "organisation",
  organisateur: "organisation",
  invite: "presents",
  laureat: "presents",
  intervenant: "presents",
};
const ORDRE: Groupe[] = ["artiste", "organisation", "presents", "autres"];

function Carte({ p, langue }: { p: PersonneAffichee; langue: Langue }) {
  const t = TEXTES[langue];
  const photo = p.image ?? p.portrait_url;
  const fiche = avecLangue(`/actualites/artiste/${slugTag(p.nom)}`, langue);
  return (
    <li className="group relative flex gap-4 rounded-2xl border border-fil bg-craie p-3 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(27,26,23,0.35)] sm:p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-panel sm:h-28 sm:w-28">
        <PortraitPersonne src={photo} nom={p.nom} />
      </div>
      <div className="min-w-0 flex-1">
        {p.role && <p className="text-xs font-medium text-terracotta">{t.roles[p.role]}</p>}
        <h3 className="font-display text-[1.45rem] leading-tight">
          <Link href={fiche} className="after:absolute after:inset-0 after:content-[''] group-hover:text-terracotta">
            {p.nom}
          </Link>
        </h3>
        {p.note && <p className="mt-1 line-clamp-3 text-[13.5px] leading-snug text-encre/75">{p.note}</p>}
        <p className="relative z-10 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gris">
          <span>{nombre(t.reportagesNb, p.nb ?? 1)}</span>
          {p.slug && (
            <Link href={`/artistes/${p.slug}`} className="font-medium text-terracotta underline-offset-4 hover:underline">
              ArTova →
            </Link>
          )}
          {p.profil && (
            <a href={p.profil} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4 hover:text-terracotta">
              {t.profilPublic} ↗
            </a>
          )}
        </p>
        {p.image && p.credit && <p className="mt-1 truncate text-[10.5px] text-gris/80">{fmt(t.creditPhoto, { credit: p.credit })}</p>}
      </div>
    </li>
  );
}

// Dossier de l'article : les personnes citées, regroupées par rôle (artistes,
// commissariat, invités), avec photo, précision sourcée, nombre de reportages et
// lien vers leur fiche. Suivi des pages consultées pour l'établir.
export function DossierActualite({
  personnes,
  enquete,
  langue,
}: {
  personnes: PersonneAffichee[];
  enquete: string | null;
  langue: Langue;
}) {
  const dossier = lireEnquete(enquete);
  if (personnes.length === 0 && !dossier?.sources.length) return null;
  const t = TEXTES[langue];
  const parGroupe = new Map<Groupe, PersonneAffichee[]>();
  for (const p of personnes) {
    const g = p.role ? GROUPE_DE[p.role] : "autres";
    parGroupe.set(g, [...(parGroupe.get(g) ?? []), p]);
  }
  const structure = parGroupe.size > 1 || !parGroupe.has("autres");
  const date = dossier?.maj
    ? new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue === "en" ? "en-GB" : "de-DE", { dateStyle: "long", timeZone: "Africa/Lome" }).format(new Date(`${dossier.maj}T12:00:00Z`))
    : null;
  return (
    <section aria-labelledby="dossier" className="mt-16">
      <TitreSection id="dossier" sous={t.dossierSous}>
        {t.dossierTitre}
      </TitreSection>
      <div className="mt-8 space-y-9">
        {ORDRE.filter((g) => parGroupe.has(g)).map((g) => (
          <div key={g}>
            {structure && <h3 className="mb-3 text-sm font-medium text-gris">{g === "autres" ? t.nomsCites : t.groupes[g]}</h3>}
            <ul className="grid gap-3 sm:grid-cols-2">
              {parGroupe.get(g)!.map((p) => (
                <Carte key={p.nom} p={p} langue={langue} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {dossier && dossier.sources.length > 0 && (
        <details className="mt-8 rounded-2xl border border-fil bg-craie px-5 py-4 text-sm">
          <summary className="cursor-pointer select-none font-medium">{t.sourcesEnquete}</summary>
          <ul className="mt-3 space-y-1.5">
            {dossier.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="break-words underline underline-offset-4 hover:text-terracotta">
                  {s.titre}
                </a>
              </li>
            ))}
          </ul>
          {date && <p className="mt-3 text-xs text-gris">{fmt(t.enqueteMaj, { date })}</p>}
        </details>
      )}
    </section>
  );
}
