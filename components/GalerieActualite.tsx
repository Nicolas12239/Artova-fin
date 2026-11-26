"use client";

import { useRef, useState } from "react";
import { TitreSection } from "./TitreSection";
import { TEXTES, fmt, type Langue } from "@/lib/actualites-i18n";

const LIBELLES = {
  fr: { agrandir: "Agrandir la photo", fermer: "Fermer", precedente: "Photo précédente", suivante: "Photo suivante" },
  en: { agrandir: "Enlarge photo", fermer: "Close", precedente: "Previous photo", suivante: "Next photo" },
  de: { agrandir: "Foto vergrößern", fermer: "Schließen", precedente: "Vorheriges Foto", suivante: "Nächstes Foto" },
} as const;

// Photos supplémentaires d'une actualité : mosaïque, puis visionneuse plein écran
// (flèches du clavier, balayage au doigt, Échap pour fermer) avec le crédit.
export function GalerieActualite({
  images,
  titre,
  credit,
  langue,
}: {
  images: string | null;
  titre: string;
  credit: string;
  langue: Langue;
}) {
  const liste = (images ?? "")
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  const [courante, setCourante] = useState(0);
  const boite = useRef<HTMLDialogElement>(null);
  const depart = useRef<number | null>(null);
  if (liste.length === 0) return null;
  const t = TEXTES[langue];
  const l = LIBELLES[langue];
  const alt = (i: number) => `${titre} (${i + 1}/${liste.length})`;
  const aller = (i: number) => setCourante((i + liste.length) % liste.length);
  const ouvrir = (i: number) => {
    setCourante(i);
    boite.current?.showModal();
  };

  return (
    <section aria-labelledby="galerie" className="mt-16">
      <TitreSection id="galerie">{t.galerie}</TitreSection>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {liste.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => ouvrir(i)}
            aria-label={`${l.agrandir} : ${alt(i)}`}
            className={`group relative overflow-hidden rounded-xl bg-panel ${i === 0 && liste.length > 2 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-[4/3]"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt(i)}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gris">{fmt(t.image, { source: credit })}</p>

      <dialog
        ref={boite}
        onClick={(e) => e.target === boite.current && boite.current?.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") aller(courante + 1);
          if (e.key === "ArrowLeft") aller(courante - 1);
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-encre/95"
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-4"
          onTouchStart={(e) => (depart.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (depart.current === null) return;
            const d = e.changedTouches[0].clientX - depart.current;
            if (Math.abs(d) > 50) aller(courante + (d < 0 ? 1 : -1));
            depart.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={liste[courante]}
            alt={alt(courante)}
            referrerPolicy="no-referrer"
            className="max-h-[78svh] max-w-full rounded-lg object-contain"
          />
          <p className="text-center text-xs text-craie/75">
            {courante + 1} / {liste.length} · {fmt(t.image, { source: credit })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => boite.current?.close()}
          aria-label={l.fermer}
          className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-craie/15 text-2xl text-craie transition-colors hover:bg-craie/30"
        >
          ×
        </button>
        {liste.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => aller(courante - 1)}
              aria-label={l.precedente}
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-craie/15 text-2xl text-craie transition-colors hover:bg-craie/30"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => aller(courante + 1)}
              aria-label={l.suivante}
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-craie/15 text-2xl text-craie transition-colors hover:bg-craie/30"
            >
              ›
            </button>
          </>
        )}
      </dialog>
    </section>
  );
}
