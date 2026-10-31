"use client";

import { useState } from "react";

// Feuille de partage native du téléphone (WhatsApp, Instagram, SMS…) ; sur
// ordinateur, copie simplement le lien.
export function BoutonPartager({ titre, texte }: { titre: string; texte: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href.split("?")[0];
        if (navigator.share) {
          try {
            await navigator.share({ title: titre, text: texte, url });
          } catch {
            // partage annulé
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopie(true);
          setTimeout(() => setCopie(false), 2500);
        } catch {
          // presse-papiers indisponible
        }
      }}
      className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-encre/80 underline-offset-4 hover:underline"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      {copie ? "Lien copié" : "Partager"}
    </button>
  );
}
