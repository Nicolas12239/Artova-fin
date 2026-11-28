"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deconnecter } from "@/app/actions/auth";

// Menu des petits écrans : panneau qui se déploie sous l'en-tête, défilement de la
// page bloqué pendant qu'il est ouvert, fermeture par Échap, par un lien ou à
// chaque changement de page.
export function MenuMobile({
  liens,
  connecte = false,
  contact,
}: {
  liens: { href: string; label: string }[];
  connecte?: boolean;
  contact?: { email: string; tiktok: string; instagram: string };
}) {
  // Le menu est « ouvert pour » une page précise : dès qu'on change de page, il est fermé.
  const chemin = usePathname();
  const [ouvertPour, setOuvertPour] = useState<string | null>(null);
  const ouvert = ouvertPour === chemin;
  const setOuvert = (v: boolean | ((courant: boolean) => boolean)) => {
    const suivant = typeof v === "function" ? v(ouvert) : v;
    setOuvertPour(suivant ? chemin : null);
  };
  const panneau = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const html = document.documentElement;
    const avant = html.style.overflow;
    html.style.overflow = "hidden";
    const fermer = (e: KeyboardEvent) => e.key === "Escape" && setOuvertPour(null);
    window.addEventListener("keydown", fermer);
    return () => {
      html.style.overflow = avant;
      window.removeEventListener("keydown", fermer);
    };
  }, [ouvert]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-11 items-center gap-3 rounded-full border border-encre/30 bg-craie pl-4 pr-3.5 text-sm font-medium text-encre"
      >
        {ouvert ? "Fermer" : "Menu"}
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span className={`absolute left-0 block h-px w-5 bg-encre transition-transform duration-200 ease-out ${ouvert ? "top-1/2 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 block h-px w-5 bg-encre transition-transform duration-200 ease-out ${ouvert ? "top-1/2 -rotate-45" : "bottom-0"}`} />
        </span>
      </button>
      <nav
        id="menu-mobile"
        ref={panneau}
        aria-label="Navigation mobile"
        inert={!ouvert}
        className={`fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto overscroll-contain bg-creme transition-[opacity,transform] duration-200 ease-out ${
          ouvert ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <ul className="flex flex-col px-6 pb-6 pt-6">
          {liens.map((lien) => (
            <li key={`${lien.href}-${lien.label}`}>
              <Link href={lien.href} className="flex min-h-14 items-center border-b border-fil font-display text-[1.75rem]">
                {lien.label}
              </Link>
            </li>
          ))}
          {connecte && (
            <li>
              <form action={deconnecter}>
                <button type="submit" className="flex min-h-14 w-full items-center border-b border-fil text-left font-display text-[1.75rem]">
                  Se déconnecter
                </button>
              </form>
            </li>
          )}
        </ul>
        {contact && (
          <div className="space-y-3 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-gris">
            <a href={`mailto:${contact.email}`} className="block break-all underline underline-offset-4">
              {contact.email}
            </a>
            <div className="flex gap-6 text-sm text-encre">
              <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center">TikTok ↗</a>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center">Instagram ↗</a>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
