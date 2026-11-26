"use client";

import { useState } from "react";

// Recherche de la rubrique : champ toujours visible sur grand écran ; sur mobile,
// une loupe déplie le champ sous les onglets (la barre reste fine).
export function RechercheActu({
  langue,
  q,
  libelle,
  placeholder,
}: {
  langue: string;
  q: string;
  libelle: string;
  placeholder: string;
}) {
  const [ouvert, setOuvert] = useState(q.length > 0);
  return (
    <>
      <button
        type="button"
        aria-label={libelle}
        aria-expanded={ouvert}
        aria-controls="recherche-actu-form"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fil text-encre transition-colors hover:border-encre md:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" strokeLinecap="round" />
        </svg>
      </button>
      <form
        id="recherche-actu-form"
        action="/actualites"
        method="get"
        role="search"
        className={`${ouvert ? "flex" : "hidden"} order-last w-full items-center gap-2 md:order-none md:flex md:w-auto md:max-w-sm md:flex-1`}
      >
        {langue !== "fr" && <input type="hidden" name="lang" value={langue} />}
        <label htmlFor="recherche-actu" className="sr-only">
          {libelle}
        </label>
        <input
          id="recherche-actu"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={80}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-full border border-fil bg-creme px-4 text-[16px] outline-none transition-colors focus:border-terracotta md:text-sm"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-full bg-encre px-5 text-sm font-medium text-creme transition-colors hover:bg-terracotta"
        >
          {libelle}
        </button>
      </form>
    </>
  );
}
