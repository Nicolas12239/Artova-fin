"use client";

import { useEffect, useRef, useState } from "react";

// Photo d'une personne citée. Si l'image d'origine disparaît, l'initiale prend la
// place : la grille garde ses proportions.
export function PortraitPersonne({
  src,
  nom,
  className = "",
  taille = "text-3xl",
}: {
  src: string | null;
  nom: string;
  className?: string;
  taille?: string;
}) {
  const [cassee, setCassee] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = image.current;
    if (el && el.complete && el.naturalWidth === 0) setCassee(true);
  }, [src]);
  if (src && !cassee) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={image}
        src={src}
        alt={nom}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setCassee(true)}
        className={`h-full w-full object-cover object-[50%_25%] ${className}`}
      />
    );
  }
  return (
    <span aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-panel font-display text-encre/55 ${taille} ${className}`}>
      {nom.trim().charAt(0).toUpperCase()}
    </span>
  );
}
