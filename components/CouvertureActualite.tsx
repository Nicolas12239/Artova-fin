"use client";

import { useState } from "react";
import type { Portee } from "@/lib/actualites-sources";

// Couleur de repli selon la portée : le Togo ressort en terre cuite, l'Afrique
// en encre, le monde en papier.
const FONDS: Record<Portee, string> = {
  togo: "bg-terracotta text-craie",
  afrique: "bg-encre text-craie",
  monde: "bg-panel text-encre",
};

// Photo de couverture d'une actualité. Quand l'article n'en a pas, ou que le
// média d'origine a retiré l'image, une couverture typographique prend le relais :
// la grille garde toujours le même rythme.
export function CouvertureActualite({
  src,
  alt,
  source,
  portee,
  prioritaire = false,
}: {
  src: string | null;
  alt: string;
  source: string;
  portee: Portee;
  prioritaire?: boolean;
}) {
  const [cassee, setCassee] = useState(false);

  if (src && !cassee) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={prioritaire ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setCassee(true)}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
    );
  }

  const initiale = source.trim().charAt(0).toUpperCase() || "A";
  return (
    <div className={`absolute inset-0 flex items-end justify-between overflow-hidden p-5 ${FONDS[portee]}`} role="img" aria-label={alt}>
      <span aria-hidden="true" className="select-none font-display text-[8.5rem] leading-[0.72] opacity-90">
        {initiale}
      </span>
      <span className="max-w-[55%] text-right text-sm leading-snug opacity-80">{source}</span>
    </div>
  );
}
