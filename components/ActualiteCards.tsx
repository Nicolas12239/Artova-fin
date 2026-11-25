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
  type Actualite,
} from "@/lib/actualites-commun";
import { TEXTES, type Langue } from "@/lib/actualites-i18n";

// Rubrique en caractères condensés : le Togo ressort en terre cuite.
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
    <p
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 font-condense text-[13px] font-semibold uppercase tracking-[0.06em] ${
        centree ? "justify-center" : ""
      }`}
    >
      <span className={a.portee === "togo" ? "text-terracotta" : claire ? "text-craie/60" : "text-gris"}>
        {t.zones[a.portee]}
      </span>
      <span aria-hidden="true" className={claire ? "text-craie/30" : "text-fil"}>
        |
      </span>
      <span className={claire ? "text-craie/85" : "text-encre"}>{t.categories[a.categorie]}</span>
    </p>
  );
}

function Compteurs({ a, langue, claire = false }: { a: Actualite; langue: Langue; claire?: boolean }) {
  const t = TEXTES[langue];
  return (
    <span className={`flex items-center gap-3.5 ${claire ? "text-craie/60" : "text-gris"}`}>
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

// Ligne de date et de signature, comme sous un article de presse.
function Signature({ a, langue, claire = false }: { a: Actualite; langue: Langue; claire?: boolean }) {
  return (
    <p className={`font-condense text-[13px] font-medium uppercase tracking-[0.05em] ${claire ? "text-craie/60" : "text-gris"}`}>
      {a.lieu && a.evenement_debut ? `${a.lieu} · ` : ""}
      {dateLongue(a.publie_le, langue)}
    </p>
  );
}

// Le texte français garde ses espaces insécables ; les autres langues restent telles quelles.
const typo = (texte: string, langue: Langue) => (langue === "fr" ? fr(texte) : texte);

// Article de la grille : rubrique, titre, photo, date, résumé, signature.
export function CarteActualite({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  return (
    <article className="group flex h-full flex-col">
      <Rubrique a={a} langue={langue} />
      <Link href={lienActualite(a, langue)} className="mt-2 flex flex-1 flex-col">
        <h3 className="font-display text-[1.7rem] leading-[1.12] decoration-1 underline-offset-[5px] group-hover:underline">
          {typo(c.titre, langue)}
        </h3>
        <div className="relative mt-4 aspect-[16/10] overflow-hidden bg-panel">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} />
          {a.videos && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-encre/90 px-2.5 py-1 font-condense text-[12px] font-semibold uppercase tracking-[0.08em] text-craie">
              <IconeLecture className="h-3.5 w-3.5" /> {t.video}
            </span>
          )}
          {a.artiste_slug && (
            <span className="absolute right-3 top-3 bg-craie px-2.5 py-1 font-condense text-[12px] font-semibold uppercase tracking-[0.08em] text-encre">
              {t.artisteArtova}
            </span>
          )}
        </div>
        <div className="mt-3">
          <Signature a={a} langue={langue} />
        </div>
        <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-encre/75">{typo(c.resume, langue)}</p>
      </Link>
      <p className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-condense text-[13px] font-semibold uppercase tracking-[0.05em] text-encre">
          {t.par} {a.source_nom}
        </span>
        <Compteurs a={a} langue={langue} />
      </p>
    </article>
  );
}

// « À la une » : grande image pleine largeur, titre centré sur fond encre.
export function VedetteActualite({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const t = TEXTES[langue];
  const c = contenuLangue(a, langue);
  return (
    <section className="bg-encre text-craie" aria-label={t.aLaUne}>
      <Link href={lienActualite(a, langue)} className="group block">
        <div className="relative aspect-[4/3] max-h-[680px] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} prioritaire />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-10 text-center sm:px-6 md:pb-20 md:pt-14">
          <div className="flex items-center justify-center gap-3 font-condense text-[13px] font-semibold uppercase tracking-[0.08em]">
            <span className="bg-terracotta px-2 py-0.5 text-craie">{a.a_la_une ? t.aLaUne : t.enVedette}</span>
            <Rubrique a={a} langue={langue} claire />
          </div>
          <h2 className="mt-5 font-display text-[2.5rem] leading-[1.04] decoration-1 underline-offset-[8px] group-hover:underline sm:text-6xl lg:text-7xl">
            {typo(c.titre, langue)}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-craie/75">{typo(c.resume, langue)}</p>
          {a.evenement_debut && <BandeauEvenement a={a} langue={langue} />}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Signature a={a} langue={langue} claire />
            <Compteurs a={a} langue={langue} claire />
          </div>
          <span className="mt-8 inline-block border-b border-terracotta pb-1 font-condense text-base font-semibold uppercase tracking-[0.08em] transition-colors group-hover:border-craie">
            {t.lire}
          </span>
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
    <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-craie/25 py-4">
      <span className="font-condense text-3xl font-bold uppercase leading-none">
        {libelleDates(a.evenement_debut, a.evenement_fin, langue)}
      </span>
      <span className="bg-terracotta px-2.5 py-1 font-condense text-[13px] font-semibold uppercase tracking-[0.08em]">
        {etat.texte}
      </span>
      <span className="font-condense text-base font-medium uppercase tracking-[0.05em] text-craie/70">
        {a.lieu ?? TEXTES[langue].lieuADefaut}
      </span>
    </div>
  );
}

// Rendez-vous de l'agenda : dates en grand, état du jour, lieu.
export function CarteAgenda({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
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
    <li className="group bg-craie">
      <Link href={lienActualite(a, langue)} className="flex h-full flex-col gap-3 border-t-4 border-encre p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-condense text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em]">
            {libelleDates(a.evenement_debut, a.evenement_fin, langue)}
          </p>
          <span className={`shrink-0 px-2 py-0.5 font-condense text-[12px] font-semibold uppercase tracking-[0.08em] ${pastille}`}>
            {etat.texte}
          </span>
        </div>
        <h3 className="font-display text-xl leading-snug decoration-1 underline-offset-4 group-hover:underline">
          {typo(c.titre, langue)}
        </h3>
        <p className="mt-auto font-condense text-[13px] font-medium uppercase tracking-[0.05em] text-gris">
          {a.lieu ?? TEXTES[langue].lieuADefaut}
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
    <li className="grid grid-cols-[3rem_1fr] gap-3 border-t border-fil py-3.5 first:border-t-0">
      <span className="pt-0.5 font-condense text-[13px] font-medium tracking-[0.04em] text-gris">{jour}</span>
      <Link href={lienActualite(a, langue)} className="group block">
        <span className="block text-[15px] font-medium leading-snug group-hover:underline group-hover:underline-offset-4">
          {typo(c.titre, langue)}
        </span>
        <span className="mt-1 block text-xs text-gris">
          {a.source_nom} · {ilYa(a.publie_le, langue)}
        </span>
      </Link>
    </li>
  );
}

// Vignette de la bande « En vidéo » : couverture, bouton de lecture, titre.
export function CarteVideo({ a, langue = "fr" }: { a: Actualite; langue?: Langue }) {
  const c = contenuLangue(a, langue);
  return (
    <article className="group">
      <Link href={lienActualite(a, langue)} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-encre">
          <CouvertureActualite src={a.image_url} alt={c.titre} source={a.source_nom} portee={a.portee} />
          <span className="absolute inset-0 flex items-center justify-center bg-encre/25 transition-colors group-hover:bg-encre/40">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-craie text-encre">
              <IconeLecture className="h-6 w-6" />
            </span>
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl leading-snug decoration-1 underline-offset-4 group-hover:underline">
          {typo(c.titre, langue)}
        </h3>
      </Link>
    </article>
  );
}
