import Link from "next/link";
import { CouvertureActualite } from "./CouvertureActualite";
import { IconeBulle, IconeCoeur } from "./IconesActualite";
import {
  CATEGORIES,
  LIBELLE_PORTEE,
  dateLongue,
  etatEvenement,
  fr,
  ilYa,
  libelleDates,
  lienActualite,
  type Actualite,
} from "@/lib/actualites";

// Rubrique en caractères condensés : le Togo ressort en terre cuite.
export function Rubrique({ a, claire = false, centree = false }: { a: Actualite; claire?: boolean; centree?: boolean }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 font-condense text-[13px] font-semibold uppercase tracking-[0.06em] ${
        centree ? "justify-center" : ""
      }`}
    >
      <span className={a.portee === "togo" ? "text-terracotta" : claire ? "text-craie/60" : "text-gris"}>
        {LIBELLE_PORTEE[a.portee]}
      </span>
      <span aria-hidden="true" className={claire ? "text-craie/30" : "text-fil"}>
        |
      </span>
      <span className={claire ? "text-craie/85" : "text-encre"}>{CATEGORIES[a.categorie]}</span>
    </p>
  );
}

function Compteurs({ a, claire = false }: { a: Actualite; claire?: boolean }) {
  return (
    <span className={`flex items-center gap-3.5 ${claire ? "text-craie/60" : "text-gris"}`}>
      <span className="flex items-center gap-1.5" title="J'aime">
        <IconeCoeur className="h-3.5 w-3.5" />
        {a.nb_likes}
      </span>
      <span className="flex items-center gap-1.5" title="Commentaires">
        <IconeBulle className="h-3.5 w-3.5" />
        {a.nb_commentaires}
      </span>
    </span>
  );
}

// Ligne de date et de signature, comme sous un article de presse.
function Signature({ a, claire = false }: { a: Actualite; claire?: boolean }) {
  return (
    <p className={`font-condense text-[13px] font-medium uppercase tracking-[0.05em] ${claire ? "text-craie/60" : "text-gris"}`}>
      {a.lieu && a.evenement_debut ? `${a.lieu} · ` : ""}
      {dateLongue(a.publie_le)}
    </p>
  );
}

// Article de la grille : rubrique, titre, photo, date, résumé, signature.
export function CarteActualite({ a }: { a: Actualite }) {
  return (
    <article className="group flex h-full flex-col">
      <Rubrique a={a} />
      <Link href={lienActualite(a)} className="mt-2 flex flex-1 flex-col">
        <h3 className="font-display text-[1.7rem] leading-[1.12] decoration-1 underline-offset-[5px] group-hover:underline">
          {fr(a.titre)}
        </h3>
        <div className="relative mt-4 aspect-[16/10] overflow-hidden bg-panel">
          <CouvertureActualite src={a.image_url} alt={a.titre} source={a.source_nom} portee={a.portee} />
        </div>
        <div className="mt-3">
          <Signature a={a} />
        </div>
        <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-encre/75">{fr(a.resume)}</p>
      </Link>
      <p className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-condense text-[13px] font-semibold uppercase tracking-[0.05em] text-encre">
          Par {a.source_nom}
        </span>
        <Compteurs a={a} />
      </p>
    </article>
  );
}

// « À la une » : grande image pleine largeur, titre centré sur fond encre.
export function VedetteActualite({ a }: { a: Actualite }) {
  return (
    <section className="bg-encre text-craie" aria-label="À la une">
      <Link href={lienActualite(a)} className="group block">
        <div className="relative aspect-[4/3] max-h-[680px] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          <CouvertureActualite src={a.image_url} alt={a.titre} source={a.source_nom} portee={a.portee} prioritaire />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-10 text-center sm:px-6 md:pb-20 md:pt-14">
          <div className="flex items-center justify-center gap-3 font-condense text-[13px] font-semibold uppercase tracking-[0.08em]">
            <span className="bg-terracotta px-2 py-0.5 text-craie">{a.a_la_une ? "À la une" : "En vedette"}</span>
            <Rubrique a={a} claire />
          </div>
          <h2 className="mt-5 font-display text-[2.5rem] leading-[1.04] decoration-1 underline-offset-[8px] group-hover:underline sm:text-6xl lg:text-7xl">
            {fr(a.titre)}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-craie/75">{fr(a.resume)}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Signature a={a} claire />
            <Compteurs a={a} claire />
          </div>
          <span className="mt-8 inline-block border-b border-terracotta pb-1 font-condense text-base font-semibold uppercase tracking-[0.08em] transition-colors group-hover:border-craie">
            Lire l&apos;actualité
          </span>
        </div>
      </Link>
    </section>
  );
}

// Rendez-vous de l'agenda : dates en grand, état du jour, lieu.
export function CarteAgenda({ a }: { a: Actualite }) {
  if (!a.evenement_debut) return null;
  const etat = etatEvenement(a.evenement_debut, a.evenement_fin);
  const pastille =
    etat.ton === "en_cours"
      ? "bg-terracotta text-craie"
      : etat.ton === "bientot"
        ? "bg-encre text-craie"
        : "border border-gris/40 text-gris";
  return (
    <li className="group bg-craie">
      <Link href={lienActualite(a)} className="flex h-full flex-col gap-3 border-t-4 border-encre p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-condense text-[1.75rem] font-bold uppercase leading-none tracking-[0.01em]">
            {libelleDates(a.evenement_debut, a.evenement_fin)}
          </p>
          <span className={`shrink-0 px-2 py-0.5 font-condense text-[12px] font-semibold uppercase tracking-[0.08em] ${pastille}`}>
            {etat.texte}
          </span>
        </div>
        <h3 className="font-display text-xl leading-snug decoration-1 underline-offset-4 group-hover:underline">{fr(a.titre)}</h3>
        <p className="mt-auto font-condense text-[13px] font-medium uppercase tracking-[0.05em] text-gris">
          {a.lieu ?? "Lomé"}
        </p>
      </Link>
    </li>
  );
}

// Brève : date, titre, média.
export function LigneBreve({ a }: { a: Actualite }) {
  const d = new Date(a.publie_le);
  const jour = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Africa/Lome" }).format(d);
  return (
    <li className="grid grid-cols-[3rem_1fr] gap-3 border-t border-fil py-3.5 first:border-t-0">
      <span className="pt-0.5 font-condense text-[13px] font-medium tracking-[0.04em] text-gris">{jour}</span>
      <Link href={lienActualite(a)} className="group block">
        <span className="block text-[15px] font-medium leading-snug group-hover:underline group-hover:underline-offset-4">
          {fr(a.titre)}
        </span>
        <span className="mt-1 block text-xs text-gris">
          {a.source_nom} · {ilYa(a.publie_le)}
        </span>
      </Link>
    </li>
  );
}
