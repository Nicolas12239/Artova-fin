import Link from "next/link";
import { CouvertureActualite } from "./CouvertureActualite";
import { IconeBulle, IconeCoeur, IconeLecture } from "./IconesActualite";
import { lienActualite } from "@/lib/actualites";
import {
  contenuLangue,
  dateLongue,
  etatEvenement,
  fr,
  ilYa,
  libelleDates,
  lirePersonnes,
  type Actualite,
} from "@/lib/actualites-commun";
import { slugTag } from "@/lib/actualites-tags";
import { avecLangue } from "@/lib/actualites-i18n";
import { TEXTES, type Langue } from "@/lib/actualites-i18n";

// Rubrique : la zone (le Togo ressort en terre cuite), puis la catégorie.
export function Rubrique({
  a,
  langue = "fr",
  claire = false,
  centree = false,
}: {
  a: Actualite;
  langue?: Langue;
  claire?: boolean;
  centree?: boolean;
}) {
  const t = TEXTES[langue];
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium ${centree ? "justify-center" : ""}`}>
      <span className={a.portee === "togo" ? (claire ? "text-[#e3b9a8]" : "text-terracotta") : claire ? "text-craie/65" : "text-gris"}>
        {t.zones[a.portee]}
      </span>
      <span aria-hidden="true" className={claire ? "text-craie/35" : "text-fil"}>
        ·
      </span>
      <span className={claire ? "text-craie/90" : "text-encre/80"}>{t.categories[a.categorie]}</span>
    </p>
  );
}

function Compteurs({ a, langue, claire = false }: { a: Actualite; langue: Langue; claire?: boolean }) {
  const t = TEXTES[langue];
  return (
    <span className={`flex items-center gap-3.5 ${claire ? "text-craie/65" : "text-gris"}`}>
      <span className="flex items-center gap-1.5" title={t.jaime}>
        <IconeCoeur className="h-3.5 w-3.5" />
        {a.nb_likes}
      </span>
      <span className="flex items-center gap-1.5" title={t.commentaires}>
        <IconeBulle className="h-3.5 w-3.5" />
        {a.nb_commentaires}
      </span>
    </span>
  );
}

// Date (et lieu d'un rendez-vous) sous un article.
function Signature({ a, langue, claire = false }: { a: Actualite; langue: Langue; claire?: boolean }) {
  return (
    <p className={`text-[13px] ${claire ? "text-craie/65" : "text-gris"}`}>
      {a.lieu && a.evenement_debut ? `${a.lieu} · ` : ""}
      {dateLongue(a.publie_le, langue)}
    </p>
  );
}

// Le texte français garde ses espaces insécables ; les autres langues restent telles quelles.
const typo = (texte: string, langue: Langue) => (langue === "fr" ? fr(texte) : texte);

const OMBRE = "hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(27,26,23,0.35)]";

// Article de la grille : photo, rubrique, titre, résumé, tags, source.
export function CarteActualite({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  return (
    <article className="reveal group flex h-full flex-col">
      <Link href={lienActualite(a, langue)} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-panel">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} />
          {a.videos && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-encre/90 px-3 py-1 text-xs font-medium text-craie">
              <IconeLecture className="h-3.5 w-3.5" /> {t.video}
            </span>
          )}
          {a.artiste_slug && (
            <span className="absolute right-3 top-3 rounded-full bg-craie/95 px-3 py-1 text-xs font-medium text-encre">{t.artisteArtova}</span>
          )}
        </div>
        <div className="mt-4">
          <Rubrique a={a} langue={langue} />
        </div>
        <h3 className="mt-2 font-display text-[1.65rem] leading-[1.12] text-balance transition-colors duration-200 group-hover:text-terracotta">
          {typo(c.titre, langue)}
        </h3>
        <p className="mt-2.5 line-clamp-3 text-[15px] leading-relaxed text-encre/70">{typo(c.resume, langue)}</p>
      </Link>
      <TagsArtistes a={a} langue={langue} />
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-gris">
        <span className="min-w-0 truncate">
          {a.source_nom} · {dateLongue(a.publie_le, langue)}
        </span>
        <Compteurs a={a} langue={langue} />
      </div>
    </article>
  );
}

// « À la une » : grande image pleine largeur, titre en surimpression en bas à gauche.
export function VedetteActualite({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  return (
    <section className="bg-encre text-craie" aria-label={t.aLaUne}>
      <Link href={lienActualite(a, langue)} className="group relative block">
        <div className="relative aspect-[4/5] max-h-[760px] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[21/9]">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} prioritaire />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-encre via-encre/45 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 md:px-8 md:pb-12">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-terracotta px-3 py-1 text-xs font-medium text-craie">{a.a_la_une ? t.aLaUne : t.enVedette}</span>
              <Rubrique a={a} langue={langue} claire />
            </div>
            <h2 className="mt-4 max-w-4xl font-display text-[2.2rem] font-medium leading-[1.04] text-balance sm:text-5xl lg:text-6xl">
              {typo(c.titre, langue)}
            </h2>
            <p className="mt-4 hidden max-w-2xl text-lg leading-relaxed text-craie/80 sm:block">{typo(c.resume, langue)}</p>
            {a.evenement_debut && <BandeauEvenement a={a} langue={langue} />}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Signature a={a} langue={langue} claire />
              <Compteurs a={a} langue={langue} claire />
              <span className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-craie px-6 text-sm font-medium text-encre transition-colors duration-200 group-hover:bg-terracotta group-hover:text-craie">
                {t.lire} →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

// Dates, état et lieu d'un rendez-vous, sur fond sombre (« à la une »).
function BandeauEvenement({ a, langue }: { a: Actualite; langue: Langue }) {
  if (!a.evenement_debut) return null;
  const etat = etatEvenement(a.evenement_debut, a.evenement_fin, undefined, langue);
  return (
    <div className="mt-5 inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-craie/25 bg-encre/50 px-4 py-2.5 backdrop-blur">
      <span className="font-display text-2xl leading-none">{libelleDates(a.evenement_debut, a.evenement_fin, langue)}</span>
      <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-xs font-medium">{etat.texte}</span>
      <span className="text-sm text-craie/75">{a.lieu ?? TEXTES[langue].lieuADefaut}</span>
    </div>
  );
}

// Rendez-vous de l'agenda : dates en grand, état du jour, lieu.
// `pleine` : la carte prend toute la largeur de sa colonne (hors carrousel).
export function CarteAgenda({ a, langue = "fr", pleine = false }: { a: Actualite; langue?: Langue; pleine?: boolean }) {
  if (!a.evenement_debut) return null;
  const c = contenuLangue(a, langue);
  const etat = etatEvenement(a.evenement_debut, a.evenement_fin, undefined, langue);
  const pastille =
    etat.ton === "en_cours"
      ? "bg-terracotta text-craie"
      : etat.ton === "bientot"
        ? "bg-encre text-craie"
        : "border border-gris/40 text-gris";
  return (
    <li className={`reveal group ${pleine ? "w-full" : "w-[17rem] md:w-auto"}`}>
      <Link
        href={lienActualite(a, langue)}
        className={`flex h-full min-h-44 flex-col gap-3 rounded-2xl border border-fil bg-craie p-5 transition-[transform,box-shadow] duration-200 ease-out ${OMBRE}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[1.7rem] font-medium leading-none">{libelleDates(a.evenement_debut, a.evenement_fin, langue)}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${pastille}`}>{etat.texte}</span>
        </div>
        <h3 className="font-display text-xl leading-snug text-balance transition-colors duration-200 group-hover:text-terracotta">
          {typo(c.titre, langue)}
        </h3>
        <p className="mt-auto flex items-center gap-1.5 text-sm text-gris">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21Z" />
            <circle cx="12" cy="9.8" r="2.4" />
          </svg>
          <span className="min-w-0 truncate">{a.lieu ?? TEXTES[langue].lieuADefaut}</span>
        </p>
      </Link>
    </li>
  );
}

// Brève : date, titre, média.
export function LigneBreve({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const c = contenuLangue(a, langue);
  const d = new Date(a.publie_le);
  const jour = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue === "en" ? "en-GB" : "de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Lome",
  }).format(d);
  return (
    <li className="border-t border-fil first:border-t-0">
      <Link href={lienActualite(a, langue)} className="group grid min-h-14 grid-cols-[3rem_1fr] gap-3 py-3.5">
        <span className="pt-0.5 text-[13px] tabular-nums text-gris">{jour}</span>
        <span className="block">
          <span className="block text-[15px] font-medium leading-snug transition-colors duration-200 group-hover:text-terracotta">
            {typo(c.titre, langue)}
          </span>
          <span className="mt-1 block text-xs text-gris">
            {a.source_nom} · {ilYa(a.publie_le, langue)}
          </span>
        </span>
      </Link>
    </li>
  );
}

// Vignette de la bande « En vidéo » : couverture, bouton de lecture, titre.
export function CarteVideo({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const c = contenuLangue(a, langue);
  return (
    <article className="reveal group">
      <Link href={lienActualite(a, langue)} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-encre">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} />
          <span className="absolute inset-0 flex items-center justify-center bg-encre/25 transition-colors duration-200 group-hover:bg-encre/40">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-craie text-encre transition-transform duration-200 ease-out group-hover:scale-105">
              <IconeLecture className="h-6 w-6" />
            </span>
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl leading-snug text-balance transition-colors duration-200 group-hover:text-terracotta">
          {typo(c.titre, langue)}
        </h3>
      </Link>
    </article>
  );
}

// Tags des personnes citées (trois au plus) : chaque nom mène à sa fiche.
export function TagsArtistes({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const noms = lirePersonnes(a.personnes).slice(0, 3);
  if (noms.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={TEXTES[langue].nomsCites}>
      {noms.map((p) => (
        <li key={p.nom}>
          <Link
            href={avecLangue(`/actualites/artiste/${slugTag(p.nom)}`, langue)}
            className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors duration-150 hover:border-encre hover:bg-encre hover:text-craie ${
              p.slug ? "border-terracotta/60 text-terracotta" : "border-fil text-gris"
            }`}
          >
            {p.nom}
          </Link>
        </li>
      ))}
    </ul>
  );
}
